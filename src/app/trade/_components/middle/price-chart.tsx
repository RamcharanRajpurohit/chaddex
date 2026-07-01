"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type AreaData,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/terminal/types";

// The fallback chart's price-scale mode — fomo's "auto / log / %" axis toggles.
export type ScaleMode = "auto" | "log" | "percent";

// Self-rendered chart (TradingView's open-source lightweight-charts), fed by our
// cached GeckoTerminal OHLCV. Two modes (the type-switcher in chart-panel):
//   • "area"    — blue line + gradient fill (DEFAULT; calm, premium, on-brand)
//   • "candles" — Heikin-Ashi SMOOTHED candles, blue up / red down (less noisy
//                 than raw candles, still OHLC for active traders)
//
// Lifecycle correctness (the adversarial findings): the chart + series are
// created ONCE (refs) and removed via chart.remove() on unmount. The component is
// REMOUNTED (via a key in chart-panel) on mint / timeframe / type change, so each
// resource gets a fresh chart — no series-swapping, no stale-data grafting. Within
// a mount, data flows through a separate effect: setData on first load, update()
// for the newest point on a poll.

export type ChartType = "area" | "candles";

// Palette — fomo's candle colours (sampled live from fomo.family's terminal):
// up = green rgb(33,201,94), down = orange-red rgb(255,98,46). This is what makes
// the chart read as a real memecoin trading terminal. Grid is barely-there
// horizontal-only; crosshair is a muted dashed line with tag labels.
const THEME = {
  up: "#21c95e", // candles up — fomo green
  upWick: "rgba(33,201,94,0.6)",
  // Area/mountain — soft white line over a dark gradient fill (kept for the
  // optional area mode; the default in-page chart is candles).
  areaLine: "#e8eaed",
  areaFillTop: "rgba(255,255,255,0.07)",
  areaFillBottom: "rgba(255,255,255,0)",
  down: "#ff622e", // candles down — fomo orange-red
  downWick: "rgba(255,98,46,0.6)",
  upVol: "rgba(33,201,94,0.22)",
  downVol: "rgba(255,98,46,0.22)",
  text: "#8b94a6",
  grid: "rgba(255,255,255,0.03)",
  crosshair: "rgba(255,255,255,0.25)",
  crosshairLabel: "#1c2230",
  border: "rgba(255,255,255,0.06)",
  bg: "transparent",
} as const;

/**
 * Heikin-Ashi transform — averages OHLC to smooth out noise. PURE; each HA candle
 * depends on the previous HA open/close, so we fold left over the series.
 */
function toHeikinAshi(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  let prevOpen = 0;
  let prevClose = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const close = (c.open + c.high + c.low + c.close) / 4;
    const open = i === 0 ? (c.open + c.close) / 2 : (prevOpen + prevClose) / 2;
    const high = Math.max(c.high, open, close);
    const low = Math.min(c.low, open, close);
    out.push({ time: c.time, open, high, low, close, volume: c.volume });
    prevOpen = open;
    prevClose = close;
  }
  return out;
}

function toCandle(c: Candle): CandlestickData {
  return { time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close };
}
function toArea(c: Candle): AreaData {
  return { time: c.time as UTCTimestamp, value: c.close };
}
function toVolume(c: Candle): HistogramData {
  return {
    time: c.time as UTCTimestamp,
    value: c.volume,
    color: c.close >= c.open ? THEME.upVol : THEME.downVol,
  };
}

export function PriceChart({
  candles,
  type = "area",
  symbol,
  scaleMode = "auto",
}: {
  candles: Candle[];
  type?: ChartType;
  /** Token symbol shown in the OHLC legend (fomo-style). */
  symbol?: string;
  /** Price-scale mode for the auto/log/% toggle row. */
  scaleMode?: ScaleMode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // One of these is set depending on `type`; both share the setData/update path.
  const priceRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Area"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Create the chart ONCE (the component remounts on type/mint/tf change).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: THEME.bg },
        textColor: THEME.text,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        // The in-chart TradingView logo is removed (it's ugly over the candles);
        // attribution is honored instead by a small "TradingView" credit rendered
        // in the chart card footer — required by the lib's Apache-2.0 NOTICE.
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: THEME.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: THEME.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: THEME.crosshairLabel },
        horzLine: { color: THEME.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: THEME.crosshairLabel },
      },
      rightPriceScale: { borderColor: THEME.border },
      timeScale: {
        borderColor: THEME.border,
        timeVisible: true,
        secondsVisible: false,
        // comfortable default candle width + a little right margin (a thin-sliver
        // chart reads as "broken"; this is the real fix for the squished look)
        barSpacing: type === "candles" ? 9 : 4,
        rightOffset: 4,
        minBarSpacing: 2,
      },
      kineticScroll: { mouse: !reduceMotion, touch: !reduceMotion },
      autoSize: true,
    });

    if (type === "candles") {
      priceRef.current = chart.addSeries(CandlestickSeries, {
        upColor: THEME.up,
        downColor: THEME.down,
        borderVisible: false,
        wickUpColor: THEME.upWick,
        wickDownColor: THEME.downWick,
      });
    } else {
      priceRef.current = chart.addSeries(AreaSeries, {
        lineColor: THEME.areaLine,
        topColor: THEME.areaFillTop,
        bottomColor: THEME.areaFillBottom,
        lineWidth: 2,
        crosshairMarkerBorderColor: THEME.areaLine,
        crosshairMarkerBackgroundColor: THEME.areaLine,
      });
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
    chart.priceScale("right").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.22 } });

    chartRef.current = chart;
    volumeRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      priceRef.current = null;
      volumeRef.current = null;
      lastTimeRef.current = null;
    };
  }, [type]);

  // Apply data: full setData on first load / timeframe switch; update() for the
  // newest point on a poll. Candles mode renders Heikin-Ashi (smoothed) data.
  useEffect(() => {
    const price = priceRef.current;
    const volume = volumeRef.current;
    const chart = chartRef.current;
    if (!price || !volume || !chart || candles.length === 0) return;

    const data = type === "candles" ? toHeikinAshi(candles) : candles;
    const newest = data[data.length - 1];
    const onlyTailChanged =
      lastTimeRef.current !== null &&
      newest.time >= lastTimeRef.current &&
      data.length > 1 &&
      data[data.length - 2].time === lastTimeRef.current;

    // On a fresh dataset we set a comfortable DEFAULT ZOOM (the most recent N
    // bars at a readable candle width) instead of fitContent() — which squeezes
    // the whole ~300-bar history into the width and makes candles unreadably
    // thin. Candles want a wider per-bar footprint than a line, so fewer bars.
    const setDefaultZoom = () => {
      const VISIBLE = type === "candles" ? 70 : 120;
      const last = data.length - 1;
      chart.timeScale().setVisibleLogicalRange({
        // a few bars of right-margin so the newest candle isn't glued to the edge
        from: Math.max(0, last - VISIBLE),
        to: last + 4,
      });
    };

    // Branch on `type` so each series is typed concretely (the series and the
    // point shape always match — they're both created from the same `type`).
    if (type === "candles") {
      const series = price as ISeriesApi<"Candlestick">;
      if (onlyTailChanged) series.update(toCandle(newest));
      else {
        series.setData(data.map(toCandle));
        setDefaultZoom();
      }
    } else {
      const series = price as ISeriesApi<"Area">;
      if (onlyTailChanged) series.update(toArea(newest));
      else {
        series.setData(data.map(toArea));
        setDefaultZoom();
      }
    }

    if (onlyTailChanged) volume.update(toVolume(candles[candles.length - 1]));
    else volume.setData(candles.map(toVolume));
    lastTimeRef.current = newest.time;
  }, [candles, type]);

  // Price-scale mode (fomo's auto / log / % toggle).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const mode =
      scaleMode === "log"
        ? PriceScaleMode.Logarithmic
        : scaleMode === "percent"
          ? PriceScaleMode.Percentage
          : PriceScaleMode.Normal;
    chart.priceScale("right").applyOptions({ mode });
  }, [scaleMode]);

  // OHLC legend (fomo's "O… H… L… C…  Vol" line over the chart) — updates on
  // crosshair move, else shows the latest candle. Painted into legendRef so the
  // chart canvas stays clean.
  useEffect(() => {
    const chart = chartRef.current;
    const legend = legendRef.current;
    if (!chart || !legend) return;

    const fmt = (n: number) => {
      if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
      // sub-1 prices: enough significant digits for memecoins
      return n.toPrecision(4);
    };
    const render = (c: Candle | undefined) => {
      if (!c) {
        legend.innerHTML = "";
        return;
      }
      const up = c.close >= c.open;
      const col = up ? THEME.up : THEME.down;
      const chg = c.open !== 0 ? ((c.close - c.open) / c.open) * 100 : 0;
      const sym = symbol ? `<b style="color:#f7f7f7">${symbol}</b> · ` : "";
      legend.innerHTML =
        `${sym}<span style="color:${col}">O</span>${fmt(c.open)} ` +
        `<span style="color:${col}">H</span>${fmt(c.high)} ` +
        `<span style="color:${col}">L</span>${fmt(c.low)} ` +
        `<span style="color:${col}">C</span>${fmt(c.close)} ` +
        `<span style="color:${col}">${up ? "+" : ""}${chg.toFixed(2)}%</span>` +
        `<span style="color:#8b94a6"> · Vol ${fmt(c.volume)}</span>`;
    };

    const latest = () => (candles.length ? candles[candles.length - 1] : undefined);
    render(latest());

    const onMove = (param: { time?: unknown; seriesData?: Map<unknown, unknown> }) => {
      if (param.time === undefined) {
        render(latest());
        return;
      }
      const hit = candles.find((c) => c.time === param.time);
      render(hit ?? latest());
    };
    chart.subscribeCrosshairMove(onMove);
    return () => chart.unsubscribeCrosshairMove(onMove);
  }, [candles, symbol]);

  return (
    <div className="price-chart relative size-full">
      {/* fomo-style OHLC legend overlay (sits over the top-left of the chart) */}
      <div
        ref={legendRef}
        className="pointer-events-none absolute left-3 top-2 z-[2] font-mono text-[12px] tabular-nums text-muted"
      />
      <div className="size-full" ref={containerRef} />
    </div>
  );
}
