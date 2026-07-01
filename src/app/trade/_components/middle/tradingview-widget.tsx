"use client";

import { useEffect, useRef } from "react";

// Full-featured TradingView Advanced Chart WIDGET — used ONLY in fullscreen mode,
// so traders get the complete toolset (drawing tools, dozens of indicators, every
// timeframe, compare, etc.) on demand, while the in-page chart stays our clean,
// on-theme lightweight-charts.
//
// Trade-off (verified via research): the widget charts from TradingView's OWN
// data, so the symbol must be one TV recognizes. For Solana tokens that means a
// pair symbol; brand-new pump.fun tokens TV hasn't indexed will show "invalid
// symbol" — that's why this is a fullscreen extra, not the default, and the
// caller only offers it for tokens likely to exist on TV.
//
// The widget is a third-party <script> that injects an iframe; we load it once
// per mount into a container and let it clean itself up on unmount.

const SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

export function TradingViewWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fresh widget mount: clear any prior content, then inject the config script.
    container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>`;

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.type = "text/javascript";
    // Themed to ChadWallet (NOT TradingView defaults): black bg, our greens/red,
    // faint white grid, soft crosshair. `overrides` recolors the candle series and
    // chart surfaces; the full toolset (drawing tools, indicators, all timeframes)
    // stays enabled.
    script.innerHTML = JSON.stringify({
      symbol,
      interval: "5",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1", // candles
      locale: "en",
      autosize: true,
      withdateranges: true, // bottom 1D/1W/1M/3M/1Y date-range tabs (fomo)
      allow_symbol_change: true,
      hide_side_toolbar: false, // left drawing-tools toolbar ON (fomo shows it)
      hide_top_toolbar: false, // top toolbar: timeframe, ƒx Indicators, undo/redo
      hide_legend: false, // the O/H/L/C + Volume legend line across the top (fomo)
      hide_volume: false, // keep the Volume legend row
      details: true, // symbol details — fomo's default (chaddex was suppressing it)
      save_image: true, // camera/snapshot button in the top toolbar
      studies: [], // no preloaded indicators; the ƒx Indicators button stays
      hotlist: false,
      // fomo's deep navy chart surface (rgb(6,5,16)), not pure black, so the
      // widget blends with the rest of the re-skinned terminal.
      backgroundColor: "#060510",
      gridColor: "rgba(255,255,255,0.05)",
      overrides: {
        // chart surface → fomo navy
        "paneProperties.background": "#060510",
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.04)",
        "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.04)",
        "scalesProperties.textColor": "#8b94a6",
        "scalesProperties.lineColor": "rgba(255,255,255,0.08)",
        // candles → fomo green / orange-red (sampled live from fomo.family)
        "mainSeriesProperties.candleStyle.upColor": "#21c95e",
        "mainSeriesProperties.candleStyle.downColor": "#ff622e",
        "mainSeriesProperties.candleStyle.borderUpColor": "#21c95e",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ff622e",
        "mainSeriesProperties.candleStyle.wickUpColor": "rgba(33,201,94,0.7)",
        "mainSeriesProperties.candleStyle.wickDownColor": "rgba(255,98,46,0.7)",
      },
      loading_screen: { backgroundColor: "#060510", foregroundColor: "#26ed80" },
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container size-full"
      style={{ height: "100%", width: "100%" }}
    />
  );
}
