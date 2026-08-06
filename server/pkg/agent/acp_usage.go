package agent

import (
	"bytes"
	"encoding/json"
	"strconv"
	"strings"
)

type acpUsageFields uint8

const (
	acpUsageInput acpUsageFields = 1 << iota
	acpUsageOutput
	acpUsageCacheRead
	acpUsageCacheWrite
	acpUsageCost
)

// acpUsageSnapshot keeps field presence separate from the parsed values.
// Prompt results are frequently partial, so a zero value alone cannot tell us
// whether a runtime explicitly reported zero or omitted the bucket entirely.
type acpUsageSnapshot struct {
	TokenUsage
	fields          acpUsageFields
	totalTokens     int64
	hasTotalTokens  bool
	inputNormalized bool
}

func (s acpUsageSnapshot) has(field acpUsageFields) bool {
	return s.fields&field != 0
}

// acpUsageAccumulator reconciles the two metering paths shared by ACP
// backends: cumulative usage_update snapshots and terminal prompt usage.
//
// Per-bucket maxima deduplicate equivalent snapshots while retaining buckets
// omitted from one path. A self-describing snapshot may replace an ambiguous
// input count with a smaller normalized count when totalTokens proves cached
// reads were included in inputTokens. It cannot do so when its total is below
// the already-observed cumulative floor, which identifies a per-call terminal
// delta arriving after a cumulative stream snapshot.
type acpUsageAccumulator struct {
	TokenUsage
	fields          acpUsageFields
	totalTokens     int64
	inputNormalized bool
}

func (a *acpUsageAccumulator) merge(next acpUsageSnapshot) {
	if next.has(acpUsageInput) {
		switch {
		case !a.has(acpUsageInput):
			a.InputTokens = next.InputTokens
			a.inputNormalized = next.inputNormalized
		case next.inputNormalized && !a.inputNormalized && a.acceptsNormalizedInput(next):
			a.InputTokens = next.InputTokens
			a.inputNormalized = true
		case next.inputNormalized == a.inputNormalized && next.InputTokens > a.InputTokens:
			a.InputTokens = next.InputTokens
		}
	}
	if next.has(acpUsageOutput) && (!a.has(acpUsageOutput) || next.OutputTokens > a.OutputTokens) {
		a.OutputTokens = next.OutputTokens
	}
	if next.has(acpUsageCacheRead) && (!a.has(acpUsageCacheRead) || next.CacheReadTokens > a.CacheReadTokens) {
		a.CacheReadTokens = next.CacheReadTokens
	}
	if next.has(acpUsageCacheWrite) && (!a.has(acpUsageCacheWrite) || next.CacheWriteTokens > a.CacheWriteTokens) {
		a.CacheWriteTokens = next.CacheWriteTokens
	}
	// Provider cost is a cumulative turn total on the ACP backends that expose
	// it. Max consolidation preserves a late/richer report without charging a
	// duplicate prompt-result and usage_update twice.
	if next.has(acpUsageCost) && (!a.has(acpUsageCost) || next.CostUSDTicks > a.CostUSDTicks) {
		a.CostUSDTicks = next.CostUSDTicks
	}

	a.fields |= next.fields
	if next.hasTotalTokens && next.totalTokens > a.totalTokens {
		a.totalTokens = next.totalTokens
	}
}

// mergeFallback fills fields omitted (or reported as zero) by a preferred
// representation. ACP's standard top-level usage is authoritative over vendor
// `_meta`, and nested `_meta.usage` is authoritative over its flat mirror.
// Provider cost still takes the maximum because zero means "not reported" and
// runtimes may expose the priced total in only one representation.
func (a *acpUsageAccumulator) mergeFallback(next acpUsageSnapshot) {
	if next.has(acpUsageInput) && (!a.has(acpUsageInput) || a.InputTokens == 0) {
		a.InputTokens = next.InputTokens
		a.inputNormalized = next.inputNormalized
	}
	if next.has(acpUsageOutput) && (!a.has(acpUsageOutput) || a.OutputTokens == 0) {
		a.OutputTokens = next.OutputTokens
	}
	if next.has(acpUsageCacheRead) && (!a.has(acpUsageCacheRead) || a.CacheReadTokens == 0) {
		a.CacheReadTokens = next.CacheReadTokens
	}
	if next.has(acpUsageCacheWrite) && (!a.has(acpUsageCacheWrite) || a.CacheWriteTokens == 0) {
		a.CacheWriteTokens = next.CacheWriteTokens
	}
	if next.has(acpUsageCost) && (!a.has(acpUsageCost) || next.CostUSDTicks > a.CostUSDTicks) {
		a.CostUSDTicks = next.CostUSDTicks
	}

	a.fields |= next.fields
	if !a.hasTotal() && next.hasTotalTokens {
		a.totalTokens = next.totalTokens
	}
}

func (a acpUsageAccumulator) has(field acpUsageFields) bool {
	return a.fields&field != 0
}

func (a acpUsageAccumulator) hasTotal() bool {
	return a.totalTokens > 0
}

func (a acpUsageAccumulator) acceptsNormalizedInput(next acpUsageSnapshot) bool {
	if !next.hasTotalTokens || next.totalTokens <= 0 {
		return false
	}
	if a.totalTokens > 0 && next.totalTokens < a.totalTokens {
		return false
	}
	// inputTokens + outputTokens is a conservative floor even when input still
	// contains cached reads. A smaller terminal total is therefore a per-call
	// delta, not a replacement for the cumulative stream counters.
	return next.totalTokens >= a.InputTokens+a.OutputTokens
}

func (a acpUsageAccumulator) snapshot() acpUsageSnapshot {
	return acpUsageSnapshot{
		TokenUsage:      a.TokenUsage,
		fields:          a.fields,
		totalTokens:     a.totalTokens,
		hasTotalTokens:  a.totalTokens > 0,
		inputNormalized: a.inputNormalized,
	}
}

func parseACPTokenUsage(data json.RawMessage) TokenUsage {
	return parseACPTokenUsageSnapshot(data).TokenUsage
}

func parseACPTokenUsageSnapshot(data json.RawMessage) acpUsageSnapshot {
	if len(data) == 0 || string(data) == "null" {
		return acpUsageSnapshot{}
	}
	var rawFields map[string]json.RawMessage
	if err := json.Unmarshal(data, &rawFields); err != nil {
		return acpUsageSnapshot{}
	}

	var snapshot acpUsageSnapshot
	if value, ok := acpUsageInt64(rawFields, "inputTokens", "input_tokens"); ok {
		snapshot.InputTokens = value
		snapshot.fields |= acpUsageInput
	}
	if value, ok := acpUsageInt64(rawFields, "outputTokens", "output_tokens"); ok {
		snapshot.OutputTokens = value
		snapshot.fields |= acpUsageOutput
	}
	if value, ok := acpUsageInt64(rawFields,
		"cachedReadTokens",
		"cacheReadTokens",
		"cached_input_tokens",
		"cache_read_tokens",
		"cache_read_input_tokens",
	); ok {
		snapshot.CacheReadTokens = value
		snapshot.fields |= acpUsageCacheRead
	}
	if value, ok := acpUsageInt64(rawFields,
		"cachedWriteTokens",
		"cacheWriteTokens",
		"cache_write_tokens",
		"cache_creation_input_tokens",
	); ok {
		snapshot.CacheWriteTokens = value
		snapshot.fields |= acpUsageCacheWrite
	}
	if value, ok := acpUsageInt64(rawFields, "costUsdTicks", "cost_usd_ticks"); ok {
		snapshot.CostUSDTicks = value
		snapshot.fields |= acpUsageCost
	}
	if value, ok := acpUsageInt64(rawFields, "totalTokens", "total_tokens"); ok {
		snapshot.totalTokens = value
		snapshot.hasTotalTokens = true
	}

	snapshot.TokenUsage, snapshot.inputNormalized = normalizeACPTokenUsage(
		snapshot.TokenUsage,
		snapshot.totalTokens,
	)
	return snapshot
}

// parseACPTokenUsageSnapshotFromMeta extracts and reconciles token usage from
// an ACP result `_meta` object. Grok Build returns both nested `_meta.usage`
// and flat mirror fields; merging them preserves fields omitted from either
// representation without double counting their duplicate values.
func parseACPTokenUsageSnapshotFromMeta(meta json.RawMessage) acpUsageSnapshot {
	if len(meta) == 0 || string(meta) == "null" {
		return acpUsageSnapshot{}
	}

	var accumulator acpUsageAccumulator
	var envelope struct {
		Usage json.RawMessage `json:"usage"`
	}
	if err := json.Unmarshal(meta, &envelope); err == nil &&
		len(envelope.Usage) > 0 && string(envelope.Usage) != "null" {
		accumulator.merge(parseACPTokenUsageSnapshot(envelope.Usage))
	}
	accumulator.mergeFallback(parseACPTokenUsageSnapshot(meta))
	return accumulator.snapshot()
}

func parseACPTokenUsageFromMeta(meta json.RawMessage) TokenUsage {
	return parseACPTokenUsageSnapshotFromMeta(meta).TokenUsage
}

// normalizeACPTokenUsage re-buckets a usage record whose inputTokens already
// contains cachedReadTokens, so the persisted buckets stay mutually exclusive
// and dashboard cost math does not charge the cached prefix twice.
//
// ACP does not specify whether cached reads are counted inside inputTokens.
// Grok Build counts them inside: totalTokens == inputTokens + outputTokens.
// The re-bucketing only happens when totalTokens proves that shape. Agents
// reporting exclusive buckets or omitting totalTokens remain unchanged.
func normalizeACPTokenUsage(usage TokenUsage, totalTokens int64) (TokenUsage, bool) {
	if totalTokens <= 0 || usage.CacheReadTokens <= 0 || usage.CacheReadTokens > usage.InputTokens {
		return usage, false
	}
	if totalTokens != usage.InputTokens+usage.OutputTokens {
		return usage, false
	}
	usage.InputTokens -= usage.CacheReadTokens
	return usage, true
}

func excludeACPCachedInput(usage TokenUsage, totalTokens int64) TokenUsage {
	normalized, _ := normalizeACPTokenUsage(usage, totalTokens)
	return normalized
}

func acpUsageInt64(fields map[string]json.RawMessage, names ...string) (int64, bool) {
	for _, name := range names {
		raw, ok := fields[name]
		if !ok {
			continue
		}
		var n json.Number
		dec := json.NewDecoder(bytes.NewReader(raw))
		dec.UseNumber()
		if err := dec.Decode(&n); err == nil {
			if value, err := n.Int64(); err == nil && value >= 0 {
				return value, true
			}
			if value, err := n.Float64(); err == nil && value >= 0 {
				return int64(value), true
			}
		}
		var s string
		if err := json.Unmarshal(raw, &s); err == nil {
			if value, err := strconv.ParseInt(strings.TrimSpace(s), 10, 64); err == nil && value >= 0 {
				return value, true
			}
		}
	}
	return 0, false
}
