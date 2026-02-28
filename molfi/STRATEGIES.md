# 🤖 Molfi Trading Strategy Library

This library contains **30 high-profitability trading strategies** optimized for crypto perpetual markets. Developers can use these as templates or combine them to build sophisticated AI trading agents on Molfi.

---

## 📈 Trend Following
*Capture sustained price movements by entering in the direction of the dominant trend.*

| # | Strategy | Description | Best For | Win Rate | Profit Factor |
|---|----------|-------------|----------|----------|---------------|
| 1 | **EMA Crossover (9/21)** | Go long when 9 EMA crosses above 21 EMA, short when below. Classic trend entry. | Trending markets | 55-60% | 1.4-1.8 |
| 2 | **Triple EMA Stack** | Enter when 8/13/21 EMAs are stacked in order. Strongest trend confirmation. | Strong trends | 52-58% | 1.5-2.0 |
| 3 | **Supertrend** | Uses ATR-based trailing stop to define trend direction. Switch on color flip. | All conditions | 50-55% | 1.3-1.6 |
| 4 | **Ichimoku Cloud Breakout** | Enter on price breaking above/below the kumo cloud with Chikou confirmation. | Sustained trends | 48-55% | 1.6-2.2 |
| 5 | **ADX Trend Strength** | Only enter when ADX > 25 (strong trend). Direction from +DI/-DI crossover. | Volatile markets | 55-62% | 1.5-1.9 |
| 6 | **Chandelier Exit** | Ride trends using ATR-based exit from highest high. Excellent for letting winners run. | Momentum | 50-56% | 1.8-2.5 |
| 7 | **Donchian Channel Breakout** | Buy at 20-period high, sell at 20-period low. Turtle Trading system. | Breakouts | 40-45% | 2.0-3.0 |

---

## ↩️ Mean Reversion
*Capitalize on overreactions by betting that prices will revert to their average.*

| # | Strategy | Description | Best For | Win Rate | Profit Factor |
|---|----------|-------------|----------|----------|---------------|
| 8 | **RSI Bounce (30/70)** | Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought). | Ranging markets | 60-68% | 1.3-1.6 |
| 9 | **Bollinger Band Squeeze** | Enter on band expansion after tight squeeze. Direction from close position. | Low volatility | 55-62% | 1.5-2.0 |
| 10 | **VWAP Reversion** | Fade moves away from VWAP. Long below VWAP, short above. | Intraday | 58-65% | 1.2-1.5 |
| 11 | **Stochastic Oversold** | Enter when %K crosses %D in oversold (< 20) or overbought (> 80) zones. | Choppy markets | 55-62% | 1.3-1.7 |
| 12 | **Keltner Channel Bounce** | Buy at lower channel, sell at upper channel. Mean reversion between bands. | Sideways | 60-65% | 1.2-1.5 |
| 13 | **Z-Score Reversion** | Calculate price Z-score. Enter when \|Z\| > 2, expecting return to mean. | Statistical edge | 62-70% | 1.3-1.6 |

---

## 🚀 Momentum
*Trade assets that are moving strongly in one direction, expecting continuation.*

| # | Strategy | Description | Best For | Win Rate | Profit Factor |
|---|----------|-------------|----------|----------|---------------|
| 14 | **MACD Divergence** | Enter when MACD histogram diverges from price (hidden divergence = continuation). | Trend continuation | 55-60% | 1.5-2.0 |
| 15 | **Rate of Change (ROC)** | Enter when ROC exceeds threshold, confirming momentum shift. | Fast markets | 50-55% | 1.6-2.2 |
| 16 | **Williams %R** | Enter on %R moving from extreme to mid-range. Confirms momentum ignition. | Volatile | 52-58% | 1.4-1.8 |
| 17 | **TTM Squeeze** | Combines Bollinger Bands + Keltner Channels. Fires when BB contracts inside KC. | Pre-breakout | 55-62% | 1.8-2.5 |
| 18 | **RSI Divergence** | When price makes new high but RSI doesn't — bearish divergence (and vice versa). | Reversals | 58-65% | 1.5-2.0 |

---

## ⚡ Volatility
*Profit from rapid price expansions and contractions.*

| # | Strategy | Description | Best For | Win Rate | Profit Factor |
|---|----------|-------------|----------|----------|---------------|
| 19 | **ATR Breakout** | Enter when candle range exceeds 1.5x ATR. Signals volatility expansion. | Breakout hunting | 45-52% | 1.8-2.5 |
| 20 | **(VCP) Pattern** | Identify tightening price ranges (lower highs, higher lows). Enter on breakout. | Consolidation | 50-58% | 2.0-3.0 |
| 21 | **ATR Trailing Stop** | Use 2x ATR as trailing stop. Ride the trend, exit on volatility spike. | Trend riding | 48-55% | 1.6-2.2 |

---

## 🕯️ Price Action
*Trade based purely on raw price movement and candlestick patterns.*

| # | Strategy | Description | Best For | Win Rate | Profit Factor |
|---|----------|-------------|----------|----------|---------------|
| 22 | **S/R Flip** | Enter when previous resistance becomes support (or vice versa). | Key levels | 55-63% | 1.5-2.0 |
| 23 | **Engulfing Candle** | Enter on bullish/bearish engulfing patterns at key levels. | Reversal points | 52-60% | 1.4-1.8 |
| 24 | **Inside Bar Breakout** | Wait for inside bar (range contraction), enter on breakout direction. | Low vol → high vol | 50-55% | 1.6-2.2 |
| 25 | **Pin Bar Reversal** | Enter on pin bars (long wick rejection) at support/resistance. | Key levels | 55-62% | 1.5-2.0 |

---

## 🧠 Advanced / Hybrid
*Complex strategies combining multiple signals or mathematical models.*

| # | Strategy | Description | Best For | Win Rate | Profit Factor |
|---|----------|-------------|----------|----------|---------------|
| 26 | **Multi-TF Confluence** | Align signals across 15m, 1H, and 4H. Only trade when all agree. | High confidence | 62-72% | 1.8-2.5 |
| 27 | **Kalman Filter Trend** | Use Kalman filter to smooth price. Trade in direction of filtered trend. | Noise reduction | 55-60% | 1.5-2.0 |
| 28 | **WaveTrend Osc** | Combines RSI-like oscillator with wave theory. Cross signals at extremes. | All conditions | 55-62% | 1.6-2.2 |
| 29 | **Order Flow Imbalance** | Analyze bid/ask volume ratio. Enter when imbalance exceeds 2:1 threshold. | Micro-structure | 58-65% | 1.4-1.8 |
| 30 | **Adaptive Selector** | Run all strategies in parallel, weight by recent performance, compound best signals. | All markets | 60-68% | 2.0-3.0 |
