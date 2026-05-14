import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, ChevronDown, Pencil, Check, Download, RotateCw } from 'lucide-react';

const STORAGE_KEY = 'theses-book-v1';

const SEED = {
  version: 4,
  theses: [
    {
      id: 'grid-resilience-2026',
      name: 'Grid Resilience',
      sector: 'Industrials × Utilities',
      conviction: 80,
      timing: '3-5 years',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'secular',
      summary: 'Grid hardware names trade at industrial multiples while their cash flows are utility-derivative — utility rate-base growth at 10%+ for 7+ years. Weighted toward EPC and components (Quanta, Eaton, MYR), HVDC cables (Prysmian, NKT), and global power management (Schneider). Deliberately light on AI-data-center-direct names (Vertiv, GE Vernova) to keep AI capex beta low.',
      hedgeNote: 'Short XLU at ~20% NAV to isolate the multiple-rerate from utility sector beta.',
      positions: [
        { id: 'g-pwr', ticker: 'PWR', name: 'Quanta Services', weight: 25, side: 'long', valuation: '28x P/E', upside: 8, notes: '70%+ revenue from electric power infrastructure; cleanest single expression' },
        { id: 'g-etn', ticker: 'ETN', name: 'Eaton', weight: 20, side: 'long', valuation: '26x P/E', upside: 5, notes: 'Global power management; ~60% electrical' },
        { id: 'g-pry', ticker: 'PRYMF', name: 'Prysmian', weight: 15, side: 'long', valuation: '14x EV/EBITDA', upside: 12, notes: '€16B transmission backlog; ~25% global HVDC share' },
        { id: 'g-hub', ticker: 'HUBB', name: 'Hubbell', weight: 10, side: 'long', valuation: '20x P/E', upside: 6, notes: 'Electrical products, T&D heavy' },
        { id: 'g-nkt', ticker: 'NKT.CO', name: 'NKT A/S', weight: 10, side: 'long', valuation: '13x EV/EBITDA', upside: 14, notes: 'Danish pure-play HVDC; RTE framework agreement' },
        { id: 'g-su', ticker: 'SU.PA', name: 'Schneider Electric', weight: 10, side: 'long', valuation: '28x P/E', upside: 4, notes: 'Global leader; international diversification' },
        { id: 'g-myr', ticker: 'MYRG', name: 'MYR Group', weight: 10, side: 'long', valuation: '20x P/E', upside: 15, notes: 'Smaller pure-play, US-T&D leveraged' },
        { id: 'g-xlu', ticker: 'XLU', name: 'Utilities Select Sector SPDR', weight: 20, side: 'hedge', valuation: '21x P/E', upside: 0, notes: 'Short to isolate multiple-rerate thesis from utility sector beta' },
      ]
    },
    {
      id: 'silver-over-gold-2026',
      name: 'Silver Over Gold',
      sector: 'Precious Metals × Industrials',
      conviction: 80,
      timing: '18-24 months',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'mid-cycle',
      summary: 'Silver carries both monetary and industrial demand (solar, EV, electronics, AI grid), while gold is monetary-only. Gold-silver ratio at extreme historical level mean-reverts within 18-24 months. If gold consolidates and silver industrial demand surges from grid/AI buildout, the 2026-27 silver move outperforms gold by 2-3x. Anchored 30% in physical (PSLV) to absorb the entry-risk after miners +160% YTD; conviction skews large pure-play (PAAS post-MAG accretion, Fresnillo as Juanicipio operator) with WPM streaming and SILJ for additional beta.',
      hedgeNote: 'Short GLD at ~20% NAV to isolate gold-silver ratio compression. Drop hedge if you want pure long-only precious metals exposure.',
      positions: [
        { id: 's-pslv', ticker: 'PSLV', name: 'Sprott Physical Silver Trust', weight: 30, side: 'long', valuation: 'NAV', upside: null, notes: 'Physical anchor; redeemable; lowest op risk in basket' },
        { id: 's-sil', ticker: 'SIL', name: 'Global X Silver Miners ETF', weight: 20, side: 'long', valuation: 'ETF', upside: null, notes: 'Broad large/mid miner beta; top holdings WPM, PAAS, CDE' },
        { id: 's-wpm', ticker: 'WPM', name: 'Wheaton Precious Metals', weight: 15, side: 'long', valuation: '38x P/E', upside: -5, notes: 'Streaming model; fixed silver cost ~$5.75/oz through 2029; lower op risk' },
        { id: 's-paas', ticker: 'PAAS', name: 'Pan American Silver', weight: 12, side: 'long', valuation: '25x P/E', upside: 8, notes: 'Largest pure-play; acquired MAG Silver Sept 2025; 44% Juanicipio stake' },
        { id: 's-fres', ticker: 'FNLPF', name: 'Fresnillo (LSE: FRES)', weight: 10, side: 'long', valuation: '12x P/E', upside: 18, notes: 'Largest primary silver producer; 56% Juanicipio operator; UK-listed diversification' },
        { id: 's-silj', ticker: 'SILJ', name: 'Amplify Junior Silver Miners ETF', weight: 8, side: 'long', valuation: 'ETF', upside: null, notes: 'Higher-beta kicker; junior exploration exposure' },
        { id: 's-ag', ticker: 'AG', name: 'First Majestic Silver', weight: 5, side: 'long', valuation: '', upside: null, notes: '57% silver revenue — highest pure-play among large names' },
        { id: 's-gld', ticker: 'GLD', name: 'SPDR Gold Trust', weight: 20, side: 'hedge', valuation: 'NAV', upside: null, notes: 'Short to isolate gold-silver ratio compression; the actual thesis is relative not directional' },
      ]
    },
    {
      id: 'china-rare-earth-2026',
      name: 'China Rare Earth Value Chain',
      sector: 'Materials × China',
      conviction: 65,
      timing: '3-5 years',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'long-cycle',
      summary: 'Refining capacity (the actual chokepoint, not raw extraction) does not move outside China by 2030. Western names (MP, Lynas, USA Rare Earth) get the headline trades but China processing dominance is locked in for 7-10 years minimum, and Goldman notes critical-minerals dominance limits other countries\' ability to retaliate via tariffs. The directional expression: long the Chinese value chain — magnet makers (JL MAG), upstream processors (China Northern Rare Earth), and downstream Chinese OEMs (Goldwind, BYD) that get structural input-cost advantage over Western competitors. Avoids the political-tape risk of shorting US/AU rare earth names.',
      hedgeNote: 'Long-only by default; thesis is directional. If beta neutralization is needed, short 10-15% broad EM Asia or MSCI China index — cleaner than shorting individual Western rare earths.',
      positions: [
        { id: 'r-jlmag', ticker: '6680.HK', name: 'JL MAG Rare-Earth', weight: 30, side: 'long', valuation: '35x P/E', upside: 5, notes: 'Largest NdFeB magnet maker globally; long-term supply agreements with China Rare Earth Group and China Northern Rare Earth' },
        { id: 'r-gldw', ticker: '2208.HK', name: 'Goldwind', weight: 18, side: 'long', valuation: '15x P/E', upside: 22, notes: 'Largest Chinese wind turbine OEM; massive NdFeB consumer; structural cost advantage' },
        { id: 'r-byd', ticker: '1211.HK', name: 'BYD', weight: 15, side: 'long', valuation: '22x P/E', upside: 12, notes: 'Major rare earth magnet consumer for EV motors; HK accessible' },
        { id: 'r-cnre', ticker: '600111.SS', name: 'China Northern Rare Earth', weight: 15, side: 'long', valuation: '25x P/E', upside: 10, notes: 'World\'s largest rare earth producer by volume (Bayan Obo); A-share via Stock Connect' },
        { id: 'r-shen', ticker: '600392.SS', name: 'Shenghe Resources', weight: 10, side: 'long', valuation: '20x P/E', upside: 8, notes: 'Integrated; 7.7% stake in MP Materials = embedded hedge; broadest geographic footprint' },
        { id: 'r-remx', ticker: 'REMX', name: 'VanEck Rare Earth/Strategic Metals ETF', weight: 7, side: 'long', valuation: 'ETF', upside: null, notes: 'Broad-basket; ~30% Chinese exposure with Western names as natural partial hedge' },
        { id: 'r-crh', ticker: '0769.HK', name: 'China Rare Earth Holdings', weight: 5, side: 'long', valuation: '', upside: null, notes: 'Smaller HK pure-play' },
      ]
    },
    {
      id: 'copper-pullback-2026',
      name: 'Copper — Buy the Pullback',
      sector: 'Materials × ASX',
      conviction: 70,
      timing: 'Phase entry 2026; payoff 2027-28',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'mid-cycle',
      summary: 'Copper supercycle is real but 2026 is the digestion year. Goldman forecasts H1 2026 average of ~US$10,710/t vs spot near US$13,000 — entry above fundamentals. Structure for phased deployment: ~52% deployable now in lower-beta diversified names (BHP, RIO) and de-rated mid-tiers (AIS, HGO); ~48% reserved for pure-play pullback (SFR, CSC, DVP) on copper retracement below US$11,500/t. Main payoff window 2027-28 as AI/grid demand catches up to constrained supply. ASX-focused for AUD currency match and franking on the majors.',
      hedgeNote: 'Phased deployment is the hedge. Tranche entries: 50% now into "deploy now" names; 25% on copper <US$11,500/t; 25% on US$10,500/t or below. US copper tariff arb (US$5.69/lb vs LME US$4.34/lb) is noise — ASX miners sell at LME prices, ignore US headlines. SULPHURIC ACID REFINEMENT (May 2026): China stopped exporting sulphuric acid; Chile heap leach SX-EW operations (Codelco, Escondida, plus CSC Mantos Blancos) hit by input shortage. Integrated smelter-refiners (BHP Olympic Dam, RIO Kennecott, Glencore) are net acid PRODUCERS and structurally advantaged. Weights refined: BHP 25→27%, RIO 12→15%, CSC 13→7%, SFR 25→23%, DVP 10→8%, GLEN added at 5%. Codelco 2026 production guidance is the key signal — cuts on acid availability confirm structural input constraint, which tightens supply picture into 2027-28 payoff window even if near-term price action stays choppy. Acid shortage strengthens the underlying supply-constrained supercycle thesis, doesn\'t weaken it.',
      positions: [
        { id: 'c-bhp', ticker: 'BHP.AX', name: 'BHP Group', weight: 27, side: 'long', valuation: '14x P/E', upside: 12, notes: 'Deploy now: copper now 51% of EBITDA; FY26 guide 1.9-2.0Mt copper; diversified anchor; Olympic Dam integrated smelter = net sulphuric acid producer, advantaged by China acid export restrictions' },
        { id: 'c-sfr', ticker: 'SFR.AX', name: 'Sandfire Resources', weight: 23, side: 'long', valuation: '15x EV/EBITDA', upside: -3, notes: 'Wait for pullback: cleanest pure-play but +100% YoY; MATSA concentrate (smelter customer, neutral on acid shortage); MATSA disruption may provide entry' },
        { id: 'c-csc', ticker: 'CSC.AX', name: 'Capstone Copper', weight: 7, side: 'long', valuation: '10x EV/EBITDA', upside: 8, notes: 'Wait for pullback: Canadian pure-play, ASX dual-listed; weight trimmed — Mantos Blancos heap leach in Chile structurally hurt by China sulphuric acid export restrictions; margin compression risk vs integrated peers' },
        { id: 'c-rio', ticker: 'RIO.AX', name: 'Rio Tinto', weight: 15, side: 'long', valuation: '10x P/E', upside: 10, notes: 'Deploy now: Oyu Tolgoi ramp to 4th-largest copper mine globally; diversified ballast; Kennecott integrated smelter = net acid producer, advantaged by acid shortage' },
        { id: 'c-dvp', ticker: 'DVP.AX', name: 'Develop Global', weight: 8, side: 'long', valuation: '25x EV/EBITDA', upside: 5, notes: 'Wait for weakness: Bill Beament vehicle; multiple projects; higher beta; early-stage projects = neutral on near-term acid dynamics' },
        { id: 'c-glen', ticker: 'GLEN.L', name: 'Glencore', weight: 5, side: 'long', valuation: '9x P/E', upside: 18, notes: 'Acid-shortage refinement: diversified miner with integrated metals smelting; major sulphuric acid byproduct producer; benefits from both copper supercycle AND acid pricing tailwinds; cleanest expression of acid-shortage micro-thesis' },
        { id: 'c-ais', ticker: 'AIS.AX', name: 'Aeris Resources', weight: 8, side: 'long', valuation: '6x EV/EBITDA', upside: 22, notes: 'Deploy now: mid-tier NSW/QLD producer; already de-rated; FCF inflection at spot' },
        { id: 'c-hgo', ticker: 'HGO.AX', name: 'Hillgrove Resources', weight: 7, side: 'long', valuation: '5x EV/EBITDA', upside: 28, notes: 'Deploy now: smallest, cheapest (~A$85m mcap); ~A$38m FCF projected at spot' },
      ]
    },
    {
      id: 'retirement-villages-2026',
      name: 'Retirement Villages — Healthspan Extension',
      sector: 'Real Estate × Healthcare',
      conviction: 72,
      timing: '18-36 months re-rate; 5+ year hold',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'long-cycle',
      summary: 'Three legs stack: (1) GLP-1 healthspan extension is unpriced — per-capita tenure in retirement villages should extend materially as people stay independent into their late 80s instead of needing aged care entry at 78-80; (2) market is actively pricing the OPPOSITE — a bearish "slowing retiree cohort" narrative on names like Ingenia; (3) INA specifically is mid-cycle beaten-up despite raising FY26 guidance, trading 26% below 200dma with 26-30% upside to broker consensus. Compression-of-morbidity favors lifestyle/independent living over heavy-care aged care.',
      hedgeNote: 'REG.AX short isolates the structural thesis — long lifestyle/independent, short heavy-care residential which faces both GLP-1 compression-of-morbidity AND AN-ACC funding squeeze (frozen at A$295/day until Oct 2026). Phase the ASX longs (INA + LIC + SGP + EGH = 65% of portfolio) over 6-9 months — all are correlated to AU housing market.',
      positions: [
        { id: 'rv-ina', ticker: 'INA.AX', name: 'Ingenia Communities', weight: 28, side: 'long', valuation: '12x P/E', upside: 26, notes: 'Primary expression; beaten up + structural thesis + GLP-1 unpriced; 26% upside to broker target alone' },
        { id: 'rv-lic', ticker: 'LIC.AX', name: 'Lifestyle Communities', weight: 18, side: 'long', valuation: '1.4x P/NTA', upside: 15, notes: 'Victoria land-lease leader; DMF regulatory overhang as entry vector; premium franchise' },
        { id: 'rv-well', ticker: 'WELL', name: 'Welltower', weight: 15, side: 'long', valuation: '24x FFO', upside: 8, notes: 'Global expression; SHOP segment is cleanest US independent living exposure' },
        { id: 'rv-sgp', ticker: 'SGP.AX', name: 'Stockland', weight: 12, side: 'long', valuation: '14x P/E', upside: 10, notes: 'Retirement living segment + AU housing recovery embedded; lower-beta diversified' },
        { id: 'rv-vtr', ticker: 'VTR', name: 'Ventas', weight: 10, side: 'long', valuation: '28x FFO', upside: 5, notes: 'Secondary US REIT; senior housing operating portfolio' },
        { id: 'rv-egh', ticker: 'EGH.AX', name: 'Eureka Group', weight: 7, side: 'long', valuation: '', upside: null, notes: 'Smaller ASX rental village operator; 98% occupancy, cheaper' },
        { id: 'rv-reg', ticker: 'REG.AX', name: 'Regis Healthcare', weight: 10, side: 'hedge', valuation: '50x P/E', upside: -15, notes: 'Short: heavy-care residential aged care at 50x P/E; most exposed to compression-of-morbidity downside + AN-ACC funding squeeze' },
      ]
    },
    {
      id: 'robotaxi-optionality-2026',
      name: 'Robotaxi & The Optionality Loop',
      sector: 'AI × Autonomy × Tesla',
      conviction: 67,
      timing: '12-24 months',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'narrative-cycle',
      summary: 'Tesla\'s equity behavior is best modeled as Elon selling perpetual narrative options — each missed product seeds the next narrative leg, which re-rates the whole company at a net gain. Robotaxi is the most credible near-term leg: Cybercab production live at Giga Texas (Apr 2026), service in 12 US cities, ~5,000 fleet, FSD v14 disengagement at 1 per 35,000 miles. Material revenue 2027+, so equity is pricing the narrative not cash flows. Structured to capture robotaxi exposure across leaders (Waymo, Apollo Go, Tesla) without overweighting Optimus tax in TSLA — since Optimus is the weakest leg of the optionality stack. Watch the half-life: optionality engine needs new narrative leg post-Optimus delays.',
      hedgeNote: 'TSLA puts at ~20-25% OTM, 9-12 month tenor, sized 3-5% NAV. Optionality holds in the middle of the distribution but tails are non-trivial (Elon distraction events, regulatory shock, FSD safety incident). Long-dated puts cheap given reflexively bullish TSLA derivatives pricing. Also: watch what Elon teases on late-2026 calls — that\'s the next optionality leg, equity re-rates around its plausibility.',
      positions: [
        { id: 'rt-tsla', ticker: 'TSLA', name: 'Tesla', weight: 30, side: 'long', valuation: '95x P/E', upside: -10, notes: 'Direct + optionality engine; Cybercab production live; accept Optimus tax for narrative engine exposure' },
        { id: 'rt-googl', ticker: 'GOOGL', name: 'Alphabet', weight: 20, side: 'long', valuation: '22x P/E', upside: 18, notes: 'Waymo years ahead on actual unsupervised autonomy; profitable robotaxi; cheap separately on AI/search' },
        { id: 'rt-uber', ticker: 'UBER', name: 'Uber', weight: 15, side: 'long', valuation: '25x P/E', upside: 12, notes: 'Fleet integration benefits regardless of which AV stack wins; high incremental margin' },
        { id: 'rt-mbly', ticker: 'MBLY', name: 'Mobileye', weight: 10, side: 'long', valuation: '30x P/E', upside: 5, notes: 'AV stack supplier to legacy auto; picks-and-shovels for non-Tesla world' },
        { id: 'rt-bidu', ticker: 'BIDU', name: 'Baidu', weight: 10, side: 'long', valuation: '10x P/E', upside: 30, notes: 'Apollo Go robotaxi in China; cheap standalone valuation; geographic diversification' },
        { id: 'rt-pony', ticker: 'PONY', name: 'Pony.ai', weight: 8, side: 'long', valuation: 'Pre-profit', upside: null, notes: 'Pure-play Chinese robotaxi; higher-beta optionality' },
        { id: 'rt-aur', ticker: 'AUR', name: 'Aurora Innovation', weight: 7, side: 'long', valuation: 'Pre-profit', upside: null, notes: 'Autonomous trucking; Uber Freight partnership; different end-market than ride-hail' },
      ]
    },
    {
      id: 'midstream-ai-energy-2026',
      name: 'Midstream — AI Energy Nexus',
      sector: 'Energy × AI Infrastructure',
      conviction: 78,
      timing: '2-4 years',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'secular',
      summary: 'Three legs: (1) Real volume growth — KMI forecasts 28 Bcf/d US gas demand growth by 2030 with 3-9 Bcf/d from data centers alone; pipeline utilization at 90% (vs 74% in 2016) with contracts extending to 7-8 years. (2) Fee-based take-or-pay structures protect cash flows regardless of commodity prices; investment-grade balance sheets; 1.5x+ distribution coverage. (3) Pipelines moving up the value chain — Williams $5.1B "power innovation" portfolio building gas plants AT data center campuses (Project Socrates with Meta = 5x EBITDA build, ~20% IRR); Energy Transfer/CloudBurst Texas; Tallgrass/Crusoe 1.8 GW Wyoming. Allocation skews 60% laggards (OKE, TRGP, DTM) where re-rate hasn\'t happened, 40% leaders (KMI, WMB).',
      hedgeNote: 'AU tax note: stick to C-corps to avoid K-1 friction (MLPs like ET/EPD issue Schedule K-1 which complicates non-US filings). Allocation is C-corp focused. Portfolio note: this is the 4th AI-capex-correlated leg in the book (with Grid, Robotaxi, partial Silver/Copper) — be aware of concentration. The TSLA puts in Robotaxi partially hedge midstream too.',
      positions: [
        { id: 'm-kmi', ticker: 'KMI', name: 'Kinder Morgan', weight: 22, side: 'long', valuation: '10x EV/EBITDA', upside: 15, notes: '40% of US gas movement; $10B+ project backlog; explicit AI narrative; up 23% YTD but more to go' },
        { id: 'm-wmb', ticker: 'WMB', name: 'Williams Companies', weight: 20, side: 'long', valuation: '13x EV/EBITDA', upside: 5, notes: 'Most aggressive power build ($5.1B portfolio); Project Socrates with Meta; +90% over 2yr already' },
        { id: 'm-oke', ticker: 'OKE', name: 'ONEOK', weight: 16, side: 'long', valuation: '10x EV/EBITDA', upside: 20, notes: 'Laggard with similar exposure; NGL + gas; less hyped, room to re-rate' },
        { id: 'm-trgp', ticker: 'TRGP', name: 'Targa Resources', weight: 14, side: 'long', valuation: '12x EV/EBITDA', upside: 18, notes: 'Permian gas growth; C-corp; benefiting from associated gas supply' },
        { id: 'm-dtm', ticker: 'DTM', name: 'DT Midstream', weight: 10, side: 'long', valuation: '11x EV/EBITDA', upside: 25, notes: 'Smaller pure-gas C-corp; less covered; cleanest proxy for laggard re-rate' },
        { id: 'm-enb', ticker: 'ENB.TO', name: 'Enbridge', weight: 10, side: 'long', valuation: '12x EV/EBITDA', upside: 12, notes: 'Canadian, lower-beta diversification; largest pipeline industrywide' },
        { id: 'm-mlpx', ticker: 'MLPX', name: 'Global X MLP & Energy Infrastructure ETF', weight: 8, side: 'long', valuation: 'ETF', upside: 10, notes: 'C-corp screened (no K-1); diversification with broad pipeline exposure' },
      ]
    },
    {
      id: 'uranium-physical-2026',
      name: 'Uranium — Physical Over Equity',
      sector: 'Energy × Critical Materials',
      conviction: 70,
      timing: '2-3 years; tranche entry',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'secular',
      summary: 'Reframed from "AI data centers + SMRs" to a pure structural supply-deficit thesis. Existing 440-reactor fleet consumes ~180M lbs/yr against ~130M lbs/yr primary supply (28% deficit) — uranium price stays bid even if data centers go 80% gas and SMRs slip to 2032+. Kazatomprom voluntarily cut 2026 quota 4% (CEO: current pricing not sufficient to incentivize 100% production); Cameco cut McArthur River 2025 guidance 19%; Sprott physical trust holds ~79M lbs, removing supply from spot. AI/SMR demand is incremental upside, not core thesis. Allocation skews 45% physical (SRUUF + YCA) and established producers; deliberately AVOIDS SMR equity (Oklo, NuScale) and nuclear utilities (CEG, VST) — those are AI-correlated and overlap with Grid Resilience.',
      hedgeNote: 'Entry-timing risk: spot at $85 (peaked $100 in Jan 2026); equities up 40-70% in 2025. Tranche entry: 50% now into physical (SRUUF/YCA), 30% on first 10% spot pullback into miners, 20% reserved for any deeper retracement. Concentration note: this is the 2nd physical-metal-heavy thesis (with Silver) — combined physical commodity weight is meaningful at the book level.',
      positions: [
        { id: 'u-sruuf', ticker: 'SRUUF', name: 'Sprott Physical Uranium Trust', weight: 35, side: 'long', valuation: 'NAV', upside: 18, notes: 'Physical anchor; pure price exposure; cleanest thesis expression; robust to AI competition concern' },
        { id: 'u-urnm', ticker: 'URNM', name: 'Sprott Uranium Miners ETF', weight: 15, side: 'long', valuation: 'ETF', upside: 15, notes: 'Diversified miner exposure without single-name execution risk' },
        { id: 'u-ccj', ticker: 'CCJ', name: 'Cameco', weight: 12, side: 'long', valuation: '35x P/E', upside: 8, notes: 'Largest Western producer; +70% in 2025; McArthur River execution issues a near-term drag but structural position strong' },
        { id: 'u-kap', ticker: 'KAP.L', name: 'Kazatomprom', weight: 10, side: 'long', valuation: '16x P/E', upside: 20, notes: 'Lowest-cost global producer; 38% global market share; supply discipline; cheaper for geopolitical concentration risk' },
        { id: 'u-pdn', ticker: 'PDN.AX', name: 'Paladin Energy', weight: 10, side: 'long', valuation: '10x EV/EBITDA fwd', upside: 25, notes: 'ASX-listed; AUD currency match; Langer Heinrich restart momentum' },
        { id: 'u-boe', ticker: 'BOE.AX', name: 'Boss Energy', weight: 8, side: 'long', valuation: 'Pre-ramp', upside: 30, notes: 'ASX-listed; Honeymoon project; recently de-rated on FY26 guidance cut = entry vector' },
        { id: 'u-yca', ticker: 'YCA.L', name: 'Yellow Cake', weight: 10, side: 'long', valuation: 'NAV', upside: 15, notes: 'Second physical vehicle for diversification; UK-listed' },
      ]
    },
    {
      id: 'brand-korea-kbeauty-2026',
      name: 'Brand Korea — K-Beauty Cohort',
      sector: 'Consumer × Cultural Cohort',
      conviction: 75,
      timing: '3-5yr re-rate; 10+yr cohort hold',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'secular',
      summary: 'K-beauty US segment forecast at 14.1% CAGR 2026-2033 ($8.5B → $18.8B), ~3x the rate of broader US cosmetics (~5%). Legacy beauty in retreat: Coty US -6%, Shiseido US -9%, Estée Lauder US -2%. Amorepacific overseas +15% revenue, +102% operating profit YoY. Defensive M&A confirms thesis from buy side (Estée Lauder paid $1.7B for Dr. Jart+, L\'Oréal acquired Dr. G, Goodai Global IPO 2026). The picks-and-shovels insight: Korean ODMs (Cosmax, Kolmar Korea) manufacture for hundreds of K-beauty brands — they win regardless of which brand goes viral, brand-agnostic. Cultural engine still accelerating — K-pop Demon Hunters most-watched Netflix film of all time, "Golden" Billboard #1, BTS/NewJeans/SEVENTEEN cohort dynamic. The 5-year-old test: when kids form brand affinity, that\'s a 30-year cohort signal that sell-side analysts can\'t price.',
      hedgeNote: 'Korea discount: chaebol governance, family control, FX volatility. ODMs (Cosmax/Kolmar) carry less of this discount than brand-led names. Execution: KRX (Korea Exchange) Northbound access requires one-time IBKR setup, similar to Stock Connect for A-shares. EL short partial-isolates legacy from K-beauty exposure (EL owns Dr. Jart+ so net negative not pure short). Refinement to original thesis: K-beauty winning, J-beauty (Shiseido) NOT actually winning — Shiseido US -9%.',
      positions: [
        { id: 'k-amorepacific', ticker: '090430.KS', name: 'Amorepacific', weight: 25, side: 'long', valuation: '22x P/E', upside: 20, notes: 'Flagship K-beauty pure-play; 15% overseas revenue growth, 102% overseas operating profit growth YoY; record KRW 4.62T 2025 revenue' },
        { id: 'k-cosmax', ticker: '192820.KS', name: 'Cosmax', weight: 22, side: 'long', valuation: '18x P/E', upside: 25, notes: 'Largest K-beauty ODM; brand-agnostic picks-and-shovels; manufactures for hundreds of K-beauty brands' },
        { id: 'k-kolmar', ticker: '161890.KS', name: 'Kolmar Korea', weight: 12, side: 'long', valuation: '16x P/E', upside: 22, notes: 'Second major K-beauty ODM; diversified manufacturing; less chaebol governance discount' },
        { id: 'k-lghh', ticker: '051900.KS', name: 'LG H&H', weight: 10, side: 'long', valuation: '14x P/E', upside: 18, notes: 'Second K-beauty conglomerate (The History of Whoo, Belif); cheaper for governance discount' },
        { id: 'k-ulta', ticker: 'ULTA', name: 'Ulta Beauty', weight: 13, side: 'long', valuation: '18x P/E', upside: 12, notes: 'US channel beneficiary; benefits from SKU velocity regardless of which brand wins; AUD-friendly via US listing' },
        { id: 'k-elf', ticker: 'ELF', name: 'e.l.f. Beauty', weight: 8, side: 'long', valuation: '30x P/E', upside: 15, notes: 'Western fast-cycle winner running similar playbook; TikTok-driven, GenZ; the only legacy-disruptor running K-beauty speed' },
        { id: 'k-el', ticker: 'EL', name: 'Estée Lauder', weight: 10, side: 'hedge', valuation: '38x P/E', upside: -15, notes: 'Short: most exposed legacy; -2% US, restructuring; partial hedge from Dr. Jart+ ownership but net negative' },
      ]
    },
    {
      id: 'aaa-collapse-platform-2026',
      name: 'AAA Collapse / Platform Compound',
      sector: 'Consumer × Gaming Platforms',
      conviction: 72,
      timing: '18-36 months AAA rerate; long-cycle platforms',
      status: 'active',
      createdAt: '2026-05-10',
      cycleStage: 'secular',
      summary: 'GenAI collapses the AAA studio moat while platform network effects compound — and TTWO/EA multiples are still pricing IP-as-moat from a world where IP-as-moat existed. The data is unambiguous: Roblox alone was responsible for 67% of all video game industry growth outside China in 2025, hitting 10.25 billion monthly engagement hours and 380M MAU (approaching Netflix\'s 16B). Meanwhile a $300M AAA game must sell ~6M+ copies just to break even, while Clair Obscur: Expedition 33 proved AAA-quality output is possible for under $10M. Steal a Brainrot was launched in 4 months by young developers and reached 25M concurrent users — the first Fortnite UGC spinoff to surpass Epic\'s own Battle Royale on key weekends. The picks-and-shovels insight: when teenagers with Claude can ship hits in 4 months, you can\'t predict which brand wins, but the platform that hosts them all does. Nintendo is the deliberate exception in the long leg — first-party IP (Mario, Pokemon, Zelda) is genuinely irreplaceable and passes the 5-year-old test, the AAA winner that survives because the IP itself is the moat, not the dev budget.',
      hedgeNote: 'Genuine long/short pair trade, not the book\'s typical "isolating hedge" structure — both legs are the thesis. TTWO short timing is the entire trade: short into post-GTA-VI launch euphoria, not before. GTA VI launches into peak narrative; the multiple explodes on launch. Bear case is the post-launch cycle when "the last $300M winner" reframes as "the exception that proves the rule." Concentration: RBLX cohort dynamics overlap with Brand Korea\'s 30-year cohort framework — both are 5-year-old-test bets on Gen Alpha forming brand affinity early. Tencent partial overlap with China rare earth exposure (sized small for this reason). RBLX EXECUTION UPDATE (May 2026): Stock down 70% from $150 ATH after Q1 2026 earnings cut 2026 bookings guidance ~$1B on age verification friction. Thesis structural mechanic intact (UGC eats AAA), execution risk has materialized. TRANCHE ENTRY DISCIPLINE for any RBLX weight increase: (1) 40-50% of intended new weight NOW at current depressed levels (~$43, near 52-week low, ARK accumulating, $6.2B cash, FCF positive); (2) 30% on June 8 adult monetization launch confirmation (app store rating stabilization + creator earnings data showing uplift from 26.6%→37.8% adult revenue share); (3) 30% on Q3 stabilization confirmation (Q2 print mid-July showing slowing sequential DAU decline). STOP ADDING if any tranche checkpoint fails — Q2 DAU decline >5% sequentially is structural-not-friction signal; securities law investigation producing SEC action is tail risk that triggers reassessment. Trigger watch: GTA VI launch + post-launch earnings cycle (TTWO short window); June 8 RBLX adult monetization launch (first execution checkpoint); Q2 RBLX DAU print mid-July (structural-vs-friction confirmation); RBLX securities law investigation outcome (tail risk).',
      positions: [
        { id: 'aaa-rblx', ticker: 'RBLX', name: 'Roblox', weight: 30, side: 'long', valuation: '4.5x bookings', upside: 60, notes: 'Primary anchor; structural UGC-eats-AAA mechanic intact; current dislocation (Q1\'26 guidance cut, -70% from $150) is regulatory friction not structural breakage; 132M DAU + $6.2B cash + June 8 adult monetization catalyst = asymmetric entry; tranche-in per hedge note discipline' },
        { id: 'aaa-ntdoy', ticker: 'NTDOY', name: 'Nintendo', weight: 16, side: 'long', valuation: '20x P/E', upside: 12, notes: 'The AAA exception that survives — Mario/Pokemon/Zelda pass 5-year-old test; Switch 2 success; first-party IP genuinely irreplaceable' },
        { id: 'aaa-msft', ticker: 'MSFT', name: 'Microsoft', weight: 12, side: 'long', valuation: '33x P/E', upside: 10, notes: 'Game Pass + Activision; diluted by other businesses but real platform exposure; lower-beta long' },
        { id: 'aaa-app', ticker: 'APP', name: 'AppLovin', weight: 10, side: 'long', valuation: '32x P/E', upside: 18, notes: 'Mobile gaming ads picks-and-shovels; benefits regardless of which mobile game wins' },
        { id: 'aaa-tcehy', ticker: 'TCEHY', name: 'Tencent', weight: 8, side: 'long', valuation: '18x P/E', upside: 15, notes: 'Largest gaming co. globally; Riot owner; ~40% Epic stake; sized small for China rare earth thesis overlap' },
        { id: 'aaa-ttwo', ticker: 'TTWO', name: 'Take-Two Interactive', weight: 12, side: 'short', valuation: '40x fwd P/E', upside: -20, notes: 'Timing critical: short into post-GTA-VI launch euphoria, not before. Last $300M winner — exception that proves the rule' },
        { id: 'aaa-ea', ticker: 'EA', name: 'Electronic Arts', weight: 8, side: 'short', valuation: '22x P/E', upside: -15, notes: 'Most exposed legacy multi-platform publisher; declining engagement vs UGC; cost-cutting cycle' },
        { id: 'aaa-ubsfy', ticker: 'UBSFY', name: 'Ubisoft', weight: 4, side: 'short', valuation: '15x P/E', upside: -25, notes: 'Already in slow-motion collapse — sized small as much may be priced; trajectory confirmation rather than fresh thesis' },
      ]
    },
    {
      id: 'ai-revenue-attribution-2026',
      name: 'AI Revenue Attribution Asymmetry',
      sector: 'Mega-Cap × AI Capex Cycle',
      conviction: 62,
      timing: '12-18 months',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'secular',
      summary: 'All four mega-cap hyperscalers are running capex at historic intensity, but the market is differentiating based on AI revenue attributability. Meta tracks toward capex equal to ~54% of sales in 2026 vs Microsoft 47% and Alphabet 46% — the highest capex/revenue ratio in megacap, running through the most cyclical core business of the four (no enterprise cloud, no SaaS, ad-only). Google Cloud grew 63% YoY to $20B with a $462B backlog; Microsoft is capacity-constrained on Azure through 2026 with M365 Copilot scaling; AWS at $37.6B/quarter at 28% growth. Meta\'s AI revenue story is "ad targeting improved" — genuinely real, but indistinguishable from cyclical ad strength in any given quarter, with no separable AI revenue line investors can underwrite. The asymmetric risk: if ad pricing softens, Meta is the only hyperscaler where you can\'t point to a 60%+ growth line item — the capex bill comes due into a black box. Llama broadly is strategically accretive (commoditizes complements like the OpenAI/Anthropic API tax, attracts talent), but Meta Superintelligence Labs is an explicit AGI binary bet, and Reality Labs still loses ~$20B/year. The pair trade isolates the attribution asymmetry: long GOOGL/MSFT/AMZN/ORCL where AI revenue is a measurable line, short META where capex is highest and revenue path is opaque, with SNAP/PINS as small cyclical-ad-pure-play confirmation shorts.',
      hedgeNote: 'Genuine relative-value pair trade sized roughly dollar-neutral (~60% long / ~40% short) to isolate the AI-revenue-attribution asymmetry rather than make a directional AI-capex call. Critical historical context: META was a 10-bagger from late 2022 lows on identical "high capex destroys returns" bear cases — short-META driven by dislike rather than dispassionate ROIC analysis is a graveyard. Discipline: size SMALL at book level (target 3-5% of total NAV) and let the spread be the trade, not the directional Meta move. Book-level GOOGL exposure now spans two theses (Robotaxi 20% + here 22%) — track aggregate. Eliminates rather than adds AI-capex-direction beta, partially offsetting the six other AI-correlated longs in the book (Grid, Robotaxi, Midstream, partial Silver, partial Copper, AAA Collapse RBLX). Trigger watch: Q3/Q4 2026 META earnings — does META produce a separable AI revenue line.',
      positions: [
        { id: 'aira-googl', ticker: 'GOOGL', name: 'Alphabet', weight: 22, side: 'long', valuation: '22x P/E', upside: 18, notes: 'Anchor long; Cloud +63% YoY, $462B backlog; cheap ex-AI on search; compounds with Robotaxi thesis exposure' },
        { id: 'aira-msft', ticker: 'MSFT', name: 'Microsoft', weight: 18, side: 'long', valuation: '33x P/E', upside: 12, notes: 'Azure capacity-constrained through 2026; M365 Copilot scaling; 47% capex/revenue lower than Meta' },
        { id: 'aira-amzn', ticker: 'AMZN', name: 'Amazon', weight: 12, side: 'long', valuation: '36x P/E', upside: 15, notes: 'AWS $37.6B/quarter at 28% growth; lowest hyperscaler capex/revenue when including retail base; diversified' },
        { id: 'aira-orcl', ticker: 'ORCL', name: 'Oracle', weight: 8, side: 'long', valuation: '30x P/E', upside: 20, notes: 'OCI growing rapidly; smaller and less covered; higher-beta confirmation long' },
        { id: 'aira-meta', ticker: 'META', name: 'Meta Platforms', weight: 25, side: 'short', valuation: '27x P/E', upside: -18, notes: 'Primary short; 54% capex/revenue (highest in megacap); ad-targeting AI revenue indistinguishable from cyclical strength; Superintelligence Labs = explicit AGI binary; Reality Labs ~$20B annual drag' },
        { id: 'aira-snap', ticker: 'SNAP', name: 'Snap Inc.', weight: 8, side: 'short', valuation: 'EV/Sales', upside: -25, notes: 'Cyclical pure-play ad short; no AI revenue line; structural engagement issues; small confirmation short' },
        { id: 'aira-pins', ticker: 'PINS', name: 'Pinterest', weight: 7, side: 'short', valuation: '25x P/E', upside: -20, notes: 'Similar pure-play; ad-dependent without enterprise diversification; lower-beta confirmation' },
      ]
    },
    {
      id: 'japan-megabank-roe-2026',
      name: 'Japan Megabank ROE Repricing',
      sector: 'Financials × Japan',
      conviction: 73,
      timing: '3-5 years; structural NIM expansion cycle',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'mid-cycle',
      summary: 'Japanese megabank ROEs are structurally repricing for the first time since the 1990s. Three megabanks (MUFG, SMFG, Mizuho) control ~60% of domestic deposits in an oligopoly bond-proxy-priced for three decades. Major banks raised ordinary deposit rates to 0.3% (highest since 1993) and lifted short-term prime lending to 2.125% effective Feb 2026; each 25bp BoJ hike flows ~¥35B annual pre-tax profit per major bank. MUFG sits at 6.0% ROE targeting 12% — at 8-9% cost of equity that implies 1.5-1.8x book vs current sub-book, 15-35% upside. SMFG at 4.8% ROE targeting 11% = 129% improvement potential not priced into a sub-book valuation. The PM paradox: Takaichi is reflationist (yen weakening, BoJ board picks dovish), but her fiscal expansion is pushing JGB yields higher for fiscal-stress reasons — yield curve steepens regardless of why, which is what banks need for NIM expansion. Under-owned globally relative to the policy shift.',
      hedgeNote: 'Currency decision is separate from this thesis. Bank P&L works on yen-denominated earnings; mix unhedged ADRs (MUFG/SMFG/MFG — implicit yen exposure on AUD translation) with currency-hedged wrapper (DXJF) to control FX beta. Yen-as-credit-cycle-hedge was 65%+ conviction under Ishiba; degraded to ~48% (amber) under Takaichi but not zero — full global risk-off still triggers repatriation of Japanese investors\' $1.2T US Treasury holdings. If you want yen as separate tail hedge, size 3-5% NAV in FXY, distinct from this position. Concentration: zero existing Japan exposure in book, zero financial-sector exposure — genuine uncorrelated diversifier vs the seven AI-correlated longs. Trigger watch: BoJ rate path under Takaichi\'s reflationist board picks; USD/JPY breaks 165+ (intervention surge); Q2/Q3 2026 megabank earnings NIM delivery.',
      positions: [
        { id: 'jmb-mufg', ticker: 'MUFG', name: 'Mitsubishi UFJ Financial Group', weight: 28, side: 'long', valuation: '0.89x P/B', upside: 25, notes: 'Largest megabank; 8% domestic loans share; ROE 6.0% → 12% target = 1.5-1.8x book justification' },
        { id: 'jmb-smfg', ticker: 'SMFG', name: 'Sumitomo Mitsui Financial Group', weight: 22, side: 'long', valuation: '0.74x P/B', upside: 30, notes: 'Biggest ROE uplift potential (4.8% → 11%); active buyback program signals management confidence' },
        { id: 'jmb-mfg', ticker: 'MFG', name: 'Mizuho Financial Group', weight: 15, side: 'long', valuation: '0.85x P/B', upside: 18, notes: 'Corporate-focused; Greenhill IB kicker; 7.6% → 8%+ ROE target' },
        { id: 'jmb-nmr', ticker: 'NMR', name: 'Nomura Holdings', weight: 10, side: 'long', valuation: '0.7x P/B', upside: 22, notes: 'Securities/IB beneficiary of normalization; different segment than commercial banks' },
        { id: 'jmb-jpb', ticker: '7182.T', name: 'Japan Post Bank', weight: 8, side: 'long', valuation: '0.5x P/B', upside: 25, notes: 'Massive JGB book directly benefits from yield rise; smaller-cap diversifier' },
        { id: 'jmb-dxjf', ticker: 'DXJF', name: 'WisdomTree Japan Hedged Financials', weight: 10, side: 'long', valuation: 'ETF', upside: 20, notes: 'Currency-hedged wrapper; reduces yen-translation beta from unhedged ADRs' },
        { id: 'jmb-td', ticker: '8795.T', name: 'T&D Holdings', weight: 7, side: 'long', valuation: '0.8x P/B', upside: 15, notes: 'Life insurance — direct yield-rise beneficiary; different segment than banks' },
      ]
    },
    {
      id: 'japan-robotics-humanoid-2026',
      name: 'Japan Robotics — Humanoid Component Hype Cycle',
      sector: 'Industrials × AI Robotics × Japan',
      conviction: 68,
      timing: '18-36 months hype-cycle; pre-committed exits',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'narrative-cycle',
      summary: 'Humanoid robotics consumer adoption is a 10-year story, not a 3-year story — but component capex runs on a different clock from consumer pull-through. Multi-billion-dollar humanoid OEM war chests (Figure, Apptronik, Tesla Optimus, Unitree, UBTECH) have 18-24 month forward order books for precision components: harmonic gears, RV reducers, servo motors, linear motion guides. Japan has structural dominance in this layer — Harmonic Drive Systems and Nabtesco operate as a duopoly in the precision reducers used in every humanoid joint regardless of which brand wins. Picks-and-shovels at one layer deeper than typical AI infrastructure — Brand Korea ODM logic applied to robotics: you can\'t predict the winning humanoid brand, but every prototype needs these components, and 30+ humanoid OEMs are now ordering. Weak yen (near 160 vs USD) provides translation tailwind to Japan-manufactured exports — these companies still manufacture domestically, unlike Toyota/Honda which have moved production offshore. The trade is the hype cycle: ride the capex flow for 18-36 months and exit on pre-committed signals before consumer disillusionment, not after.',
      hedgeNote: 'Hype-cycle trade, not structural compounder. Pre-committed exit triggers — any two firing simultaneously = sell half the basket; any three = exit entirely: (1) Tesla Optimus consumer timeline walked back on earnings call; (2) Figure or Apptronik IPO S-1 filing; (3) Harmonic Drive book-to-bill <1.0 for 2 consecutive quarters; (4) USD/JPY decisive break of 165+ (intervention) or 145- (FX tailwind dies); (5) any major humanoid harm incident with regulatory response. The "kid getting stepped on" version of the trade is to exit on signals 1-4 before signal 5 fires — by the time the viral video hits, the stocks are down 30%. Concentration: 7th AI-correlated long in book, but second-order effect (humanoid component duopoly) is distinct from AI capex cluster. Cycle genuinely different from semiconductor capex — factory automation orders track manufacturing PMI; humanoid component orders track OEM funding rounds. Weak yen is tactical (12-month kicker), not structural.',
      positions: [
        { id: 'jr-harmonic', ticker: '6324.T', name: 'Harmonic Drive Systems', weight: 28, side: 'long', valuation: '40x P/E', upside: 25, notes: 'Precision gear monopoly; every humanoid uses these; purest humanoid pure-play in Japan' },
        { id: 'jr-nabtesco', ticker: '6268.T', name: 'Nabtesco', weight: 20, side: 'long', valuation: '22x P/E', upside: 20, notes: 'Duopoly with Harmonic Drive in precision reducers; cheaper for execution gap' },
        { id: 'jr-yaskawa', ticker: '6506.T', name: 'Yaskawa Electric', weight: 16, side: 'long', valuation: '25x P/E', upside: 18, notes: 'Servo motors core humanoid component; #2 industrial robotics; dual industrial/humanoid exposure' },
        { id: 'jr-kawasaki', ticker: '7012.T', name: 'Kawasaki Heavy Industries', weight: 14, side: 'long', valuation: '18x P/E', upside: 22, notes: 'Explicit humanoid program (Kaleido); diversified industrial base provides downside support' },
        { id: 'jr-thk', ticker: '6481.T', name: 'THK Co.', weight: 10, side: 'long', valuation: '20x P/E', upside: 25, notes: 'Linear motion guides used in every humanoid prototype; less covered' },
        { id: 'jr-fanuc', ticker: '6954.T', name: 'Fanuc', weight: 8, side: 'long', valuation: '28x P/E', upside: 12, notes: 'World #1 industrial robotics; lighter weight in humanoid-skewed version; sector exposure' },
        { id: 'jr-keyence', ticker: '6861.T', name: 'Keyence', weight: 4, side: 'long', valuation: '35x P/E', upside: 8, notes: 'Machine vision; ~50% op margins; lower weight as more industrial-skewed' },
      ]
    },
    {
      id: 'solana-agent-economy-2026',
      name: 'Solana — Agent Economy Settlement Layer',
      sector: 'Crypto Infrastructure × AI Agent Economy',
      conviction: 60,
      timing: '18-36 months for rail-share crystallization',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'secular',
      summary: 'Solana is the leading settlement layer for what is now a real machine-to-machine economy. Pay.sh (Solana Foundation + Google Cloud, May 2026) lets AI agents pay for APIs — Gemini, BigQuery, Vertex AI, Cloud Run, plus 50+ external providers — using USDC on Solana via the x402 protocol and Machine Payments Protocol. 60-second wallet onboarding, no accounts, no API keys, no subscriptions. The proof point isn\'t speculative: Coinbase\'s Agentic Market on Base has already processed 165M transactions across 480K AI agents. The question isn\'t whether the agent sub-economy is real — it is — but which rails win. Solana\'s structural advantages: $14B+ stablecoin supply (70% USDC), Western Union USDPT settlement, Anchorage + JPM Asset Management tokenized reserves, Israel BILS shekel stablecoin, SoFi exploring same. Network upgrades landing: Alpenglow consensus (12s → 150ms finality) and Firedancer (1M+ TPS target) early 2026. SOL is down 70% from $295.90 ATH while ETF inflows accelerate ($1B+ AUM across BSOL/FSOL/peers), validator adoption deepens, and fundamentals improve. Asymmetric setup, not "undervalued" by traditional metrics — TVL multiple still rich vs ETH, but the agent-economy narrative crystallizing into a washed-out price is the trade.',
      hedgeNote: 'Going Solana-only instead of broader rails (Base, Ethereum L2s, Sui) accepts wrong-rail risk explicitly. Most telling counter-signal: Coinbase chose Base for their own Agentic Market product, not Solana. The bet is that Solana wins the agent settlement war, not just that the agent economy happens. No short leg by design — directional on rail adoption. Real risks ranked: (1) DPRK hacks have created structural security premium ($285M Drift Protocol exploit was largest DeFi hack of 2026); (2) validator centralization more pronounced than Ethereum; (3) crowded long positioning (~75%) creates liquidation cascade risk; (4) competing L1s with similar parallel-execution architectures; (5) regulatory uncertainty on staking-enabled ETFs. AU/IBKR access constraints push ~89% of basket through equity wrappers (ETFs + treasury companies); 11% direct SOL via CoinSpot for purity and staking yield optionality. Conviction stays amber because the rail-winner question is genuinely open — sage conviction would require Coinbase migrating Agentic Market to Solana, or a credible Pay.sh equivalent failing on a competing chain. Trigger watch: Coinbase Agentic Market vs Pay.sh head-to-head metrics is the single most important signal; major Solana outage >4hrs is structural-break exit trigger.',
      positions: [
        { id: 'saes-bsol', ticker: 'BSOL', name: 'Bitwise Solana ETF', weight: 30, side: 'long', valuation: 'ETF', upside: 50, notes: 'Primary anchor; largest direct SOL ETF; regulated wrapper avoids hack/custody risk' },
        { id: 'saes-ford', ticker: 'FORD', name: 'Forward Industries', weight: 22, side: 'long', valuation: 'NAV-based', upside: 40, notes: 'Largest US-listed SOL treasury (~$1B in SOL); $1B buyback signal' },
        { id: 'saes-fsol', ticker: 'FSOL', name: 'Fidelity Solana ETF', weight: 17, side: 'long', valuation: 'ETF', upside: 50, notes: 'Second issuer for ETF diversification; Fidelity custody quality' },
        { id: 'saes-hodl', ticker: 'HODL.CN', name: 'Sol Strategies', weight: 13, side: 'long', valuation: 'NAV-based', upside: 60, notes: 'Canadian-listed validator + treasury; cleaner Solana pure-play than NDA peers' },
        { id: 'saes-sol', ticker: 'SOL', name: 'Direct SOL (CoinSpot)', weight: 11, side: 'long', valuation: 'Spot', upside: 60, notes: 'Direct exposure; AU custody via CoinSpot; full beta + staking yield optionality' },
        { id: 'saes-dfdv', ticker: 'DFDV', name: 'DeFi Dev Corp', weight: 7, side: 'long', valuation: 'NAV-based', upside: 75, notes: 'Solana DeFi treasury; $5B equity line; highest-beta speculative kicker' },
      ]
    },
    {
      id: 'private-credit-slow-burn-2026',
      name: 'Private Credit — Slow Burn',
      sector: 'Financials × Credit Cycle',
      conviction: 78,
      timing: '12-18 months active alpha window; close before Stage 2 activates',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'credit-cycle',
      summary: 'The first explicit credit-cycle thesis in the book. We are at the BNP-Paribas-equivalent moment — the private wrapper layer (BDCs, interval funds, semi-liquid vehicles) is already gating while public spreads remain falsely tight. NAV-based valuations create a 12-18 month lag between marks and realizable price; that gap closes via the spread of stress from private wrappers to public BDC equity. The damage is not a Lehman cascade — it is brand-destroying for the "private beats public" narrative for a generation. BDCs trade at 17-25% discount to NAV (CWBDC index at 17%, OBDC at 20-25%). PIK income rose from ~5% in 2022 to 11%+ by end-2025 — a structural break, not noise. 40% of private credit borrowers have negative free cash flow (up from 25% in 2021). US private credit default rate at 5.8% TTM through Jan 2026. The transmission mechanism is not direct credit losses flowing to banks but back-leverage cascade: fund-level leverage gets covenant-breached when redemptions force NAV mark-downs. Blackstone\'s $400M proprietary BCRED injection was not to cover credit losses — it was to prevent the leverage cascade. UNPRICED: second wave of NAV mark-downs (12-18 month lag from current stress), 2021-22 vintage refinancing cliff (ongoing 2026-27), software/tech concentration drag (public BDCs 20.8% software vs HY 4.7%), and the multi-year brand damage that cannot unhappen.',
      hedgeNote: 'First pure credit-cycle thesis in book — explicit Stage 1 trade. Works NOW because we are at the BNP Paribas-equivalent moment (private credit gates triggering, NAV/realizable gap exposed, marks lagging reality). Must close before Stage 2 fully activates (target 12-18 months) — if held through equity capitulation, broad sell-off compresses the alpha earned and other defensive positions activate. Net 85% short / 15% long under dollar-neutral by design — short side IS the thesis, not symmetric hedge. Long leg now split: KRE (regional banks regaining share, the rebuild) + BN (Oaktree distressed franchise, the direct beneficiary). BN trade-off acknowledged: BAM private credit AUM is the wrong side of the thesis at sub-entity level, but Oaktree distressed expertise + persistent NAV discount nets positive. Concentration check: BDCs and alt managers correlate within basket; software default cycle is cross-cutting risk hitting multiple positions simultaneously. Trigger watch: BCRED Q2 2026 redemption print (>5% = gating near-certain); PIK income share crossing 12% (acceleration confirmed); BDC discount widening >25% on multiple names (second wave breaking); any large fund actually gating vs cap-funded (narrative break event); Fed cut path (more cuts = thesis weakens, less = strengthens). Cycle-stage caveat: this thesis is timing-critical in a way none of the others are — late entry compresses returns rapidly as the asset class re-rates.',
      positions: [
        { id: 'pc-bx', ticker: 'BX', name: 'Blackstone', weight: 18, side: 'short', valuation: '28x P/E', upside: -25, notes: 'Flagship BCRED gating risk; biggest brand-damage if narrative breaks; $400M proprietary injection signals stress' },
        { id: 'pc-owl', ticker: 'OWL', name: 'Blue Owl', weight: 15, side: 'short', valuation: '30x P/E', upside: -30, notes: 'OBDC II merger debacle already exposed NAV/price gap; tech-heavy portfolio; worst optics in sector' },
        { id: 'pc-apo', ticker: 'APO', name: 'Apollo Global', weight: 12, side: 'short', valuation: '14x P/E', upside: -20, notes: 'Heavy private credit + Athene insurance leverage cascade risk; multi-layer exposure' },
        { id: 'pc-ares', ticker: 'ARES', name: 'Ares Management', weight: 10, side: 'short', valuation: '32x P/E', upside: -25, notes: 'Largest BDC franchise (ARCC); concentration risk if narrative breaks' },
        { id: 'pc-arcc', ticker: 'ARCC', name: 'Ares Capital', weight: 12, side: 'short', valuation: '8x P/E', upside: -20, notes: 'Largest public BDC; software exposure; bellwether for the sector' },
        { id: 'pc-obdc', ticker: 'OBDC', name: 'Blue Owl Capital Corp', weight: 10, side: 'short', valuation: '9x P/E', upside: -18, notes: 'Already at 20-25% discount to NAV; further to go as marks catch up' },
        { id: 'pc-htgc', ticker: 'HTGC', name: 'Hercules Capital', weight: 8, side: 'short', valuation: '10x P/E', upside: -22, notes: 'Most tech-concentrated BDC; cleanest exposure to software default cycle' },
        { id: 'pc-kre', ticker: 'KRE', name: 'SPDR Regional Banks ETF', weight: 7, side: 'long', valuation: '14x P/E', upside: 15, notes: 'Beneficiary: regional banks regain share as private credit retreats; the rebuild leg' },
        { id: 'pc-bn', ticker: 'BN', name: 'Brookfield Corporation', weight: 8, side: 'long', valuation: '0.7x NAV', upside: 25, notes: 'Long leg via Oaktree distressed franchise — direct credit-cycle beneficiary; persistent ~20-30% NAV discount provides margin of safety; acknowledged BAM private credit AUM is partial offset at sub-entity level' },
      ]
    },
    {
      id: 'insurance-ai-labor-2026',
      name: 'Insurance — AI Eats Labor Cost',
      sector: 'Financials × AI Productivity',
      conviction: 68,
      timing: '3-5 years for full margin uplift; ongoing deployment',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'secular',
      summary: 'Consensus prices AI in insurance as an underwriting accuracy story (premium growth, better risk selection). The non-consensus reality: the biggest impact is back-office labor cost compression at scale — claims, customer service, document handling, underwriting workflow automation. Morgan Stanley projects 200bp expense ratio improvement (30.5 → 28.5 by 2030) and 180bp operating margin uplift across P&C carriers; specialty insurers (Arch Capital, Everest, Hamilton) sit at 25-27% assumed automation rate vs 20-21% for standard carriers (Travelers, Allstate, Progressive). The alpha lives in DISPERSION not direction. Brokers (Marsh McLennan, Aon, Gallagher) have labor at 50%+ of cost — AI compresses their PRIMARY cost line, not a 10% slice. Run-off specialists (Enstar) are pure labor cost arbitrage business models. Deployment is already real: Travelers partnered with Anthropic to put nearly 10,000 engineers on Claude AI tools; Travelers + OpenAI AI Claim Assistant handles incoming claim calls, with ~50% of first notice of loss now going digital. The market is pricing the underwriting accuracy story (consensus) but mispricing the cost-compression dispersion (alpha). The losers — BPO firms like EXL Service and Genpact that built businesses on insurance back-office labor arbitrage — face direct disintermediation.',
      hedgeNote: 'First true picks-and-shovels expression of AI-eats-labor inside legacy industries (book pattern: own infrastructure that benefits regardless of which AI provider wins). 85% long / 15% short structure: longs capture labor cost compression dispersion across three layers (P&C carriers, brokers, specialty/run-off); shorts capture the BPO casualty leg directly. Concentration check: secular cycle stage means this thesis survives credit cycle drawdowns — cost reduction matters MORE in downturns when premium growth slows. Cross-book overlap: T&D Holdings in Japan Megabank thesis is the only adjacent insurance position (different geography, different mechanic). Real tail risk to flag: AI could disintermediate brokers entirely if buyers eventually use AI to compare and buy insurance directly — this is a 2030+ risk for MMC/AJG/AON, caps terminal value but doesn\'t break the near-term cost-compression thesis. Trigger watch: Travelers quarterly headcount vs revenue growth (labor leverage ratio); Morgan Stanley AI insurance update reports; EXLS/Genpact insurance segment revenue trajectory as disintermediation signal.',
      positions: [
        { id: 'ins-trv', ticker: 'TRV', name: 'Travelers', weight: 15, side: 'long', valuation: '13x P/E', upside: 18, notes: 'Cleanest publicly-committed AI deployment; Anthropic 10K engineers + OpenAI Claim Assistant in production' },
        { id: 'ins-mmc', ticker: 'MMC', name: 'Marsh McLennan', weight: 13, side: 'long', valuation: '24x P/E', upside: 15, notes: 'Largest broker; labor 50%+ of cost; primary cost line directly attacked by AI' },
        { id: 'ins-acgl', ticker: 'ACGL', name: 'Arch Capital', weight: 11, side: 'long', valuation: '11x P/E', upside: 20, notes: 'Highest specialty automation rate (25-27%); reinsurance complexity = more AI capture' },
        { id: 'ins-cb', ticker: 'CB', name: 'Chubb', weight: 11, side: 'long', valuation: '13x P/E', upside: 14, notes: 'Quality pure-play anchor; commercial/specialty mix; Buffett validation via Berkshire stake' },
        { id: 'ins-pgr', ticker: 'PGR', name: 'Progressive', weight: 10, side: 'long', valuation: '18x P/E', upside: 12, notes: 'Personal lines AI leader; clean expression among auto-focused carriers' },
        { id: 'ins-ajg', ticker: 'AJG', name: 'Arthur J Gallagher', weight: 8, side: 'long', valuation: '28x P/E', upside: 18, notes: 'Mid-cap broker, less analyst coverage; pure-play labor cost compression' },
        { id: 'ins-eg', ticker: 'EG', name: 'Everest Group', weight: 7, side: 'long', valuation: '8x P/E', upside: 22, notes: 'Specialty reinsurance; high automation rate; cheapest in basket' },
        { id: 'ins-esgr', ticker: 'ESGR', name: 'Enstar Group', weight: 6, side: 'long', valuation: '1.2x P/B', upside: 25, notes: 'Pure-play run-off labor arbitrage; smallest cap, highest beta to thesis' },
        { id: 'ins-aon', ticker: 'AON', name: 'Aon', weight: 4, side: 'long', valuation: '23x P/E', upside: 15, notes: 'Second broker for diversification; quality franchise' },
        { id: 'ins-exls', ticker: 'EXLS', name: 'EXL Service', weight: 10, side: 'short', valuation: '22x P/E', upside: -25, notes: 'Primary BPO short; ~50%+ revenue from insurance back-office; direct disintermediation' },
        { id: 'ins-g', ticker: 'G', name: 'Genpact', weight: 5, side: 'short', valuation: '16x P/E', upside: -18, notes: 'Diversified BPO with material insurance exposure; secondary short' },
      ]
    },
    {
      id: 'eu-banks-dispersion-2026',
      name: 'European Banks — Execution Dispersion & Consolidation',
      sector: 'Financials × Europe',
      conviction: 65,
      timing: '12-24 months for dispersion + M&A catalysts',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'mid-cycle',
      summary: 'European banks completed their valuation rerate in 2025 — best year on record, with the deep-value-recovery trade now broadly accepted. The non-consensus angle has shifted from "EU vs US" (now consensus) to execution dispersion and consolidation among specific names. Goldman\'s highest-conviction European bank stocks by potential upside: UBS Group (+34%), UniCredit (+29%), Banco BPM (+29%), Julius Baer (+25%), Alpha Bank (+21%), KBC Group (+21%). Catalysts have shifted from the rate-driven 2025 rally to capital return execution, M&A consolidation optionality (pan-European banking champions push by ECB, politically constrained but driving UniCredit\'s Commerzbank stake and BPM dynamics), and German fiscal execution. Germany\'s 2025 budget and infrastructure fund law passed late September; defense spending picks up in 2026 — but Goldman flags Germany\'s "recent track record of underdelivering on budgeted investments." The contrarian bet is "Germany actually executes" — DBK\'s "Global Hausbank" status pays asymmetrically if it does. Three legs: quality compounders with wealth/capital-return discipline (UBS, KBC, Julius Baer); M&A consolidation plays (UCG as active consolidator, BPM as target/acquirer); fiscal expansion direct play (DBK). Plus diversifiers: ING (Dutch retail quality undervalued), HSBC (global Asia exposure hedges pure-EU concentration), Crédit Agricole (French retail ballast).',
      hedgeNote: 'Mid-cycle bank repricing thesis — same shape as Japan Megabank but different mechanism. Japan = NIM expansion from rate normalization (mechanical, just starting). Europe = capital return execution + consolidation + fiscal execution (already largely repriced, dispersion is the alpha). Together these form a "non-US bank repricing" cluster but sized as two distinct theses, not bundled. Cycle position later than Japan — ECB hiking peaked 2023, extended pause now; the NIM tailwind is largely banked. Real risks: (1) ECB easing earlier than expected compresses NIM; (2) tariff/trade tensions hit export-oriented loan books; (3) Germany fails to execute infrastructure fund (historical track record) caps DBK upside; (4) M&A consolidation politically blocked (Italy\'s Golden Power, Spain\'s merger conditions can stall deals). Long-only by design — relative-value short-US-banks expression would add risk without idiosyncratic alpha now that "EU > US" is consensus. AU/IBKR access: all positions listed on major European exchanges, ADRs available for several (UBS, ING, HSBC trade in US too). Trigger watch: UniCredit-Commerzbank stake escalation; Banco BPM M&A activity; Germany infrastructure fund execution data; ECB easing path; Goldman conviction-name target updates.',
      positions: [
        { id: 'eub-ubs', ticker: 'UBS', name: 'UBS Group', weight: 20, side: 'long', valuation: '11x P/E', upside: 34, notes: 'Goldman highest-conviction; wealth management quality + Credit Suisse integration optionality' },
        { id: 'eub-ucg', ticker: 'UCG.MI', name: 'UniCredit', weight: 18, side: 'long', valuation: '9x P/E', upside: 29, notes: 'Most active M&A consolidator in Europe; Commerzbank stake; BPM dynamics' },
        { id: 'eub-bpm', ticker: 'BPM.MI', name: 'Banco BPM', weight: 12, side: 'long', valuation: '8x P/E', upside: 29, notes: 'M&A consolidation target/acquirer; Italian mid-cap leverage' },
        { id: 'eub-kbc', ticker: 'KBC.BR', name: 'KBC Group', weight: 12, side: 'long', valuation: '9x P/E', upside: 21, notes: 'Belgian quality compounder; capital returns; diversifier' },
        { id: 'eub-baer', ticker: 'BAER.SW', name: 'Julius Baer', weight: 10, side: 'long', valuation: '11x P/E', upside: 25, notes: 'Pure-play Swiss wealth management; capital returns' },
        { id: 'eub-ing', ticker: 'ING.AS', name: 'ING Group', weight: 8, side: 'long', valuation: '7x P/E', upside: 20, notes: 'Dutch quality undervalued vs sector; retail + corporate diversification' },
        { id: 'eub-dbk', ticker: 'DBK.DE', name: 'Deutsche Bank', weight: 8, side: 'long', valuation: '9x P/E', upside: 18, notes: 'German fiscal expansion direct play; "Global Hausbank" status; contrarian if Germany executes' },
        { id: 'eub-hsba', ticker: 'HSBA.L', name: 'HSBC Holdings', weight: 7, side: 'long', valuation: '8x P/E', upside: 15, notes: 'Global with Asia exposure; hedges pure-EU concentration; quality income' },
        { id: 'eub-aca', ticker: 'ACA.PA', name: 'Crédit Agricole', weight: 5, side: 'long', valuation: '7x P/E', upside: 12, notes: 'French retail ballast; quality dividend; lower-beta diversifier' },
      ]
    },
    {
      id: 'ai-capex-beta-2026',
      name: 'AI Capex Beta — 24-Month Direct Exposure',
      sector: 'Technology × AI Infrastructure',
      conviction: 75,
      timing: '24 months — tactical sleeve, hard sell signal at horizon',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'secular',
      summary: 'Direct first-order play on AI capex continuation. NOT a second-order effect thesis — this is straightforward picks-and-shovels exposure to the buildout. The mechanism: hyperscalers physically cannot slow capex over the next 24 months regardless of ROI clarity, due to (1) competitive game theory among the Big 5 — slowing means permanent share loss; (2) national security framing — US-China AI competition is now policy; (3) the 75% of GDP growth concentration tied to AI capex makes Fed support implicit. Big 5 hyperscaler capex forecast at ~$800B in 2026 and ~$1.1T in 2027; the wave runs whether or not the productivity dividend arrives in time. Own the layers that get bought regardless of which AI lab wins, which model architecture dominates, or which agent framework captures developer mindshare. Eight layers in the basket: compute (NVDA, AVGO), foundry (TSM), lithography (ASML), networking (ANET), memory (MU), semicap (AMAT), power (CEG), cooling (VRT) — together these are the irreducible physical layer of the buildout.',
      hedgeNote: 'This thesis is an intentional departure from the book\'s pattern. The rest of the book targets unpriced second-order effects; this is first-order directional beta on a consensus trade. Sized as a tactical 24-month sleeve to capture the "no graceful exit" dynamic. Conviction is sage (75%) reflecting directional certainty even though the trade is crowded — the bet is on duration, not edge. Cross-book overlap is significant: this thesis compounds rather than diversifies the existing 7-thesis AI capex correlation cluster (Grid, Robotaxi, Midstream, partial Silver, partial Copper, AAA Collapse RBLX, Japan Robotics). AI Revenue Attribution short META is the only partial offset. At portfolio allocation time, this needs to be sized AGAINST the cluster, not on top of it. EXIT TRIGGERS — 24-month duration is a hard sell signal regardless of price action; earlier exits if any of: (1) NVDA quarterly capex guidance cut from hyperscaler customers; (2) ASML EUV order cancellations from foundries; (3) Bond market repricing of hyperscaler debt by >50bp widening (credit cycle leading indicator — the same signal that would activate your Private Credit Stage 2 rotation); (4) Chinese algorithmic efficiency breakthrough that demonstrably displaces Western training demand >20% (DeepSeek-scale event with sustained market reaction). Trigger watch: NVDA hyperscaler capex commentary; ASML order book trajectory; TSM N2/N3 capacity commitments; MSFT/GOOGL 2027 capex guidance; hyperscaler debt credit spreads.',
      positions: [
        { id: 'cap-nvda', ticker: 'NVDA', name: 'NVIDIA', weight: 22, side: 'long', valuation: '35x P/E', upside: 25, notes: 'Compute primary anchor; Blackwell-Ultra-Rubin cadence; multi-year visibility; can\'t be displaced over 24mo horizon' },
        { id: 'cap-avgo', ticker: 'AVGO', name: 'Broadcom', weight: 14, side: 'long', valuation: '28x P/E', upside: 20, notes: 'Custom AI accelerators (Google TPU, Meta MTIA partnerships); networking IP; the "second NVDA"' },
        { id: 'cap-tsm', ticker: 'TSM', name: 'Taiwan Semiconductor', weight: 12, side: 'long', valuation: '22x P/E', upside: 22, notes: 'Foundry monopoly at advanced node; makes everyone\'s chips; geopolitical risk priced in' },
        { id: 'cap-asml', ticker: 'ASML', name: 'ASML Holding', weight: 10, side: 'long', valuation: '32x P/E', upside: 18, notes: 'EUV lithography monopoly; chokepoint for advanced node; multi-year backlog' },
        { id: 'cap-anet', ticker: 'ANET', name: 'Arista Networks', weight: 10, side: 'long', valuation: '38x P/E', upside: 22, notes: 'Data center networking switches; AI fabric standard; Meta + Microsoft anchor customers' },
        { id: 'cap-amat', ticker: 'AMAT', name: 'Applied Materials', weight: 8, side: 'long', valuation: '22x P/E', upside: 20, notes: 'Most diversified semicap; tools across deposition, etch, inspection' },
        { id: 'cap-mu', ticker: 'MU', name: 'Micron Technology', weight: 8, side: 'long', valuation: '14x P/E', upside: 30, notes: 'HBM memory cycle; AI accelerator pairing; cheapest in basket' },
        { id: 'cap-vrt', ticker: 'VRT', name: 'Vertiv Holdings', weight: 8, side: 'long', valuation: '35x P/E', upside: 25, notes: 'Data center cooling + power; liquid cooling adoption curve; consensus position with room' },
        { id: 'cap-ceg', ticker: 'CEG', name: 'Constellation Energy', weight: 8, side: 'long', valuation: '22x P/E', upside: 20, notes: 'Nuclear power for data centers; Microsoft 20-year deal; only scaled nuclear pure-play' },
      ]
    },
    {
      id: 'water-ai-capex-2026',
      name: 'Water — The Unpriced AI Capex Layer',
      sector: 'Industrials × Water Infrastructure × AI',
      conviction: 72,
      timing: '18-36 months for narrative crystallization; 3-5 year structural buildout',
      status: 'active',
      createdAt: '2026-05-11',
      cycleStage: 'secular',
      summary: 'Retail and most institutional investors have treated AI capex as a chip story (NVIDIA), then a power story (utilities, nuclear), then a hyperscaler story. Almost nobody has treated it as a water story. The signal that this is about to change came March 20, 2026: Ecolab paid $4.75B cash for CoolIT Systems — a Calgary-based liquid-cooling specialist owned by KKR — at 29x forward EBITDA. KKR realized 15x its original equity. CEO Christophe Beck described the combination as providing "a complete cooling solution that improves performance and reliability, while reducing water and energy use" — Ecolab\'s high-tech growth engine doubles from $5B to $10B as a result. Smart money doesn\'t pay 29x EBITDA in cash for an industrial business unless they believe a category is on the cusp of structural transformation. The mechanism: every hyperscale data center being designed for 2026-2028 commissioning is liquid-cooled by default, and liquid cooling requires water treatment infrastructure. The integration of water + cooling into a single contract is the new mandatory layer that nobody is yet sizing as an investment story. The picks-and-shovels insight: every hyperscaler designing for 2026-2028 needs liquid cooling + water treatment as a unified solution; the layer one removed — the public water companies serving the integration — is where capital hasn\'t priced in the demand step-change. Contract signals are everywhere: Microsoft deploying closed-loop water recycling in Arizona and Wisconsin (125M liters saved per facility annually); AWS planning 120 data centers with reclaimed water by 2030 (530M gallons saved annually); Essential Utilities investing $26M in Pennsylvania for an 18-million-gallon-per-day treatment plant for a data center and its onsite power facility. The equity story just hasn\'t caught up.',
      hedgeNote: 'Like AI Capex Beta (#18), this thesis sits in the AI capex correlation cluster — the book now has 9 broadly AI-correlated longs. But the second-order effect is genuinely distinct: water is the only layer of the AI buildout where the most informed industrial-strategic acquirer (Ecolab) has revealed-preference signaled "we cannot afford to be left out" via a 29x premium. Compare to power (consensus, fully priced) and cooling (VRT consensus, 109% YoY backlog growth visible). Water-side compounding is the unpriced version of the same trade. Cross-book overlap with AI Capex Beta thesis (cooling/VRT, power/CEG) is intentional — these theses are deliberately complementary sub-layer plays, not duplicate exposures. Real risks: (1) state legislation on data center water usage could constrain growth (30+ states introduced 300+ bills in 2026); (2) water utility regulatory rate cases could move slowly, capping AWK/WTRG upside in near term; (3) Ecolab-CoolIT deal already moved ECL stock — entry premium is higher than 6 months ago; (4) consensus catches up faster than expected as more water+cooling M&A deals confirm the thesis publicly. The thesis works if water becomes the next AI capex narrative leg over the 18-36 month window; if it stays unpriced longer, fundamentals compound and entry remains attractive. Trigger watch: more water+cooling M&A deals at premium multiples (confirmation); ECL high-tech segment quarterly growth toward $10B target; XYL data center pipeline disclosures; hyperscaler water reuse contract announcements; state legislation on data center water; WTRG Pennsylvania plant operational milestones.',
      positions: [
        { id: 'wtr-ecl', ticker: 'ECL', name: 'Ecolab', weight: 22, side: 'long', valuation: '30x P/E', upside: 25, notes: 'The integrator anchor; CoolIT acquisition signals category transformation; high-tech segment doubling $5B→$10B; 29x EBITDA M&A signal is the thesis itself' },
        { id: 'wtr-xyl', ticker: 'XYL', name: 'Xylem', weight: 18, side: 'long', valuation: '25x P/E', upside: 25, notes: 'Largest pure-play water tech; pumps, treatment, AI-driven optimization tools; cleanest sector expression' },
        { id: 'wtr-pnr', ticker: 'PNR', name: 'Pentair', weight: 14, side: 'long', valuation: '22x P/E', upside: 22, notes: 'Water treatment + filtration; growing data center pipeline; cheaper than ECL on multiple' },
        { id: 'wtr-wtrg', ticker: 'WTRG', name: 'Essential Utilities', weight: 12, side: 'long', valuation: '18x P/E', upside: 20, notes: 'Water utility actively building data center infrastructure ($26M PA plant); proof of the data-center-as-customer model' },
        { id: 'wtr-wts', ticker: 'WTS', name: 'Watts Water', weight: 10, side: 'long', valuation: '20x P/E', upside: 25, notes: 'Water filtration + flow control; smaller cap, higher beta to thesis' },
        { id: 'wtr-awk', ticker: 'AWK', name: 'American Water Works', weight: 8, side: 'long', valuation: '24x P/E', upside: 15, notes: 'Largest US water utility; regulatory rate-base growth from AI demand surge; lower-beta anchor' },
        { id: 'wtr-veoey', ticker: 'VEOEY', name: 'Veolia Environment', weight: 8, side: 'long', valuation: '16x P/E', upside: 20, notes: 'Global water services giant; international diversification; cheap on European multiple' },
        { id: 'wtr-fele', ticker: 'FELE', name: 'Franklin Electric', weight: 8, side: 'long', valuation: '18x P/E', upside: 28, notes: 'Water pumps + groundwater systems; smaller cap kicker; less covered' },
      ]
    }
  ]
};

const uid = () => Math.random().toString(36).slice(2, 10);
const SIDE_OPTS = ['long', 'short', 'hedge'];
const STATUS_OPTS = ['active', 'watching', 'closed'];
const CYCLE_STAGE_OPTS = ['secular', 'long-cycle', 'mid-cycle', 'credit-cycle', 'narrative-cycle'];

const PRESET_CYCLE_STAGES = {
  'grid-resilience-2026': 'secular',
  'silver-over-gold-2026': 'mid-cycle',
  'china-rare-earth-2026': 'long-cycle',
  'copper-pullback-2026': 'mid-cycle',
  'retirement-villages-2026': 'long-cycle',
  'robotaxi-optionality-2026': 'narrative-cycle',
  'midstream-ai-energy-2026': 'secular',
  'uranium-physical-2026': 'secular',
  'brand-korea-kbeauty-2026': 'secular',
  'aaa-collapse-platform-2026': 'secular',
  'ai-revenue-attribution-2026': 'secular',
  'japan-megabank-roe-2026': 'mid-cycle',
  'japan-robotics-humanoid-2026': 'narrative-cycle',
  'solana-agent-economy-2026': 'secular',
  'private-credit-slow-burn-2026': 'credit-cycle',
  'insurance-ai-labor-2026': 'secular',
  'eu-banks-dispersion-2026': 'mid-cycle',
  'ai-capex-beta-2026': 'secular',
  'water-ai-capex-2026': 'secular',
};

function cycleStageColor(stage) {
  switch (stage) {
    case 'secular': return '#5C7A4D';
    case 'long-cycle': return '#2F4A52';
    case 'mid-cycle': return '#B5853A';
    case 'credit-cycle': return '#A0432B';
    case 'narrative-cycle': return '#6B5C56';
    default: return '#9a9485';
  }
}

function formatCycleStage(stage) {
  if (!stage) return '';
  return stage.toUpperCase().replace(/-/g, ' ');
}

function convictionColor(v) {
  const n = Math.max(0, Math.min(100, Number(v) || 0));
  if (n < 40) return '#A0432B';
  if (n < 70) return '#B5853A';
  return '#5C7A4D';
}

function upsideColor(u) {
  if (u === null || u === undefined || u === '') return '#9A9485';
  const n = Number(u);
  if (isNaN(n) || n === 0) return '#9A9485';
  if (n > 0) return '#5C7A4D';
  return '#A0432B';
}

function migrate(data) {
  if (!data || !Array.isArray(data.theses)) return { version: 4, theses: [] };
  if (data.version === 4) return data;

  let working = data;

  // v?→v3 migration: existing
  if (working.version !== 3) {
    working = {
      version: 3,
      theses: (working.theses || []).map(t => ({
        ...t,
        conviction: typeof t.conviction === 'number' && t.conviction <= 5
          ? t.conviction * 20
          : (typeof t.conviction === 'number' ? t.conviction : 60),
        timing: t.timing || '',
        positions: (t.positions || []).map(p => ({
          ...p,
          valuation: p.valuation || '',
          upside: p.upside === undefined ? null : p.upside,
        }))
      }))
    };
  }

  // v3 → v4 migration: backfill cycleStage from preset mapping or default to 'secular'
  return {
    version: 4,
    theses: (working.theses || []).map(t => ({
      ...t,
      cycleStage: t.cycleStage || PRESET_CYCLE_STAGES[t.id] || 'secular',
    }))
  };
}

export default function App() {
  const [data, setData] = useState({ version: 4, theses: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [editingThesis, setEditingThesis] = useState(null);
  const [addingThesis, setAddingThesis] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [stageFilter, setStageFilter] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Manrope:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let parsed;
        try {
          const result = await window.storage.get(STORAGE_KEY);
          parsed = result?.value ? JSON.parse(result.value) : { theses: [] };
        } catch {
          parsed = { theses: [] };
        }

        parsed = migrate(parsed);

        const existingIds = new Set((parsed.theses || []).map(t => t.id));
        const missingPresets = SEED.theses.filter(t => !existingIds.has(t.id));
        if (missingPresets.length > 0) {
          parsed = { ...parsed, theses: [...missingPresets, ...(parsed.theses || [])] };
        }

        try { await window.storage.set(STORAGE_KEY, JSON.stringify(parsed)); } catch {}

        setData(parsed);
        if (parsed.theses?.[0]) setExpanded({ [parsed.theses[0].id]: true });
      } catch (e) {
        setError('Load failed: ' + e.message);
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); }
    catch (e) { setError('Save failed: ' + e.message); }
  };

  const addThesis = async (thesis) => {
    const next = { ...data, theses: [thesis, ...data.theses] };
    setExpanded(prev => ({ ...prev, [thesis.id]: true }));
    await persist(next);
    setAddingThesis(false);
  };

  const updateThesis = async (id, patch) => {
    const next = { ...data, theses: data.theses.map(t => t.id === id ? { ...t, ...patch } : t) };
    await persist(next);
  };

  const deleteThesis = async (id) => {
    if (!confirm('Delete this thesis? This cannot be undone.')) return;
    const next = { ...data, theses: data.theses.filter(t => t.id !== id) };
    await persist(next);
  };

  const addPosition = async (thesisId, position) => {
    const next = {
      ...data,
      theses: data.theses.map(t => t.id === thesisId
        ? { ...t, positions: [...t.positions, { ...position, id: uid() }] }
        : t)
    };
    await persist(next);
  };

  const updatePosition = async (thesisId, positionId, patch) => {
    const next = {
      ...data,
      theses: data.theses.map(t => t.id === thesisId
        ? { ...t, positions: t.positions.map(p => p.id === positionId ? { ...p, ...patch } : p) }
        : t)
    };
    await persist(next);
  };

  const deletePosition = async (thesisId, positionId) => {
    const next = {
      ...data,
      theses: data.theses.map(t => t.id === thesisId
        ? { ...t, positions: t.positions.filter(p => p.id !== positionId) }
        : t)
    };
    await persist(next);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theses-book-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reloadPresets = async () => {
    const existingIds = new Set(data.theses.map(t => t.id));
    const missing = SEED.theses.filter(t => !existingIds.has(t.id));
    if (missing.length === 0) {
      setSyncToast('All presets already loaded');
      setTimeout(() => setSyncToast(null), 2000);
      return;
    }
    const next = { ...data, theses: [...missing, ...data.theses] };
    await persist(next);
    setSyncToast(`Added ${missing.length} preset${missing.length > 1 ? 's' : ''}`);
    setTimeout(() => setSyncToast(null), 2400);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="text-stone-500" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '0.08em', fontSize: 11 }}>
          LOADING
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={bgStyle}>
      <style>{`
        .serif { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
        .sans { font-family: 'Manrope', system-ui, sans-serif; }
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: 'ss02'; }
        .nums { font-variant-numeric: tabular-nums; }
        .hairline { background: #C9BFAB; height: 1px; }
        input:focus, textarea:focus, select:focus { outline: none; box-shadow: inset 0 -1px 0 0 #1a1a1a; }
        .row-hover:hover { background: #ECE5D5; }
        .btn-text { transition: opacity 150ms ease; }
        .btn-text:hover { opacity: 0.55; }
        input[type=range] { -webkit-appearance: none; height: 2px; background: #D8CFBF; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--thumb-color, #1a1a1a); cursor: pointer; border: none; }
        input[type=range]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--thumb-color, #1a1a1a); cursor: pointer; border: none; }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">

        <header className="mb-16">
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-y-2">
            <div className="sans text-[10px] tracking-[0.22em] text-stone-500 uppercase">
              Theses Book · v3
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              <button onClick={reloadPresets} className="btn-text sans text-[10px] tracking-[0.18em] text-stone-500 uppercase flex items-center gap-1.5">
                <RotateCw size={11} strokeWidth={1.5} /> Sync presets
              </button>
              <button onClick={exportData} className="btn-text sans text-[10px] tracking-[0.18em] text-stone-500 uppercase flex items-center gap-1.5">
                <Download size={11} strokeWidth={1.5} /> Export
              </button>
              <button onClick={() => setAddingThesis(true)} className="btn-text sans text-[10px] tracking-[0.18em] text-stone-900 uppercase flex items-center gap-1.5">
                <Plus size={12} strokeWidth={1.5} /> New thesis
              </button>
            </div>
          </div>
          <h1 className="serif text-[44px] sm:text-[56px] leading-[1.02] text-stone-900 tracking-tight" style={{ fontWeight: 350 }}>
            Investment Theses
          </h1>
          <div className="mt-6 hairline" />
          <div className="mt-3 sans text-[11px] tracking-[0.04em] text-stone-500 flex items-center gap-3">
            <span><span className="nums">{data.theses.length}</span> {data.theses.length === 1 ? 'thesis' : 'theses'} · auto-saved</span>
            {syncToast && (
              <span className="text-stone-700 italic" style={{ fontFamily: "'Fraunces', serif" }}>· {syncToast}</span>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-8 sans text-[12px] text-red-800 px-4 py-3" style={{ background: '#F4E2D8', border: '1px solid #D8B5A0' }}>
            {error}
          </div>
        )}

        {addingThesis && (
          <ThesisForm onSubmit={addThesis} onCancel={() => setAddingThesis(false)} />
        )}

        {data.theses.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="sans text-[10px] tracking-[0.18em] uppercase text-stone-400">View</span>
            <button
              onClick={() => setStageFilter(null)}
              className="sans text-[10px] tracking-[0.16em] uppercase btn-text"
              style={{
                color: stageFilter === null ? '#1a1a1a' : '#9a9485',
                borderBottom: stageFilter === null ? '1px solid #1a1a1a' : '1px solid transparent',
                paddingBottom: 2,
              }}
            >
              All <span className="mono nums ml-1">{data.theses.length}</span>
            </button>
            {CYCLE_STAGE_OPTS.map(stage => {
              const count = data.theses.filter(t => (t.cycleStage || 'secular') === stage).length;
              if (count === 0) return null;
              const active = stageFilter === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(active ? null : stage)}
                  className="sans text-[10px] tracking-[0.16em] uppercase btn-text"
                  style={{
                    color: active ? cycleStageColor(stage) : '#9a9485',
                    borderBottom: active ? `1px solid ${cycleStageColor(stage)}` : '1px solid transparent',
                    paddingBottom: 2,
                  }}
                >
                  {formatCycleStage(stage)} <span className="mono nums ml-1">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-12">
          {data.theses.length === 0 && !addingThesis && (
            <div className="serif italic text-stone-400 text-[20px] py-16 text-center" style={{ fontWeight: 300 }}>
              No theses yet. Add one to begin.
            </div>
          )}
          {data.theses.length > 0 && data.theses.filter(t => stageFilter === null || (t.cycleStage || 'secular') === stageFilter).length === 0 && (
            <div className="serif italic text-stone-400 text-[16px] py-12 text-center" style={{ fontWeight: 300 }}>
              No theses in {formatCycleStage(stageFilter)} stage.
            </div>
          )}
          {data.theses.filter(t => stageFilter === null || (t.cycleStage || 'secular') === stageFilter).map((thesis) => (
            <ThesisBlock
              key={thesis.id}
              thesis={thesis}
              expanded={!!expanded[thesis.id]}
              editing={editingThesis === thesis.id}
              onToggle={() => setExpanded(prev => ({ ...prev, [thesis.id]: !prev[thesis.id] }))}
              onEditStart={() => setEditingThesis(thesis.id)}
              onEditCancel={() => setEditingThesis(null)}
              onEditSave={async (patch) => { await updateThesis(thesis.id, patch); setEditingThesis(null); }}
              onDelete={() => deleteThesis(thesis.id)}
              onAddPosition={(pos) => addPosition(thesis.id, pos)}
              onUpdatePosition={(pid, patch) => updatePosition(thesis.id, pid, patch)}
              onDeletePosition={(pid) => deletePosition(thesis.id, pid)}
            />
          ))}
        </div>

        <footer className="mt-24 hairline" />
        <div className="mt-3 sans text-[10px] tracking-[0.18em] text-stone-400 uppercase text-center">
          End of book · {new Date().toISOString().slice(0,10)}
        </div>
      </div>
    </div>
  );
}

const bgStyle = {
  background: '#F2EDE3',
  color: '#1a1a1a',
  fontFamily: "'Manrope', system-ui, sans-serif",
};

function ThesisBlock({ thesis, expanded, editing, onToggle, onEditStart, onEditCancel, onEditSave, onDelete, onAddPosition, onUpdatePosition, onDeletePosition }) {
  const [addingPos, setAddingPos] = useState(false);

  const totalLong = thesis.positions.filter(p => p.side === 'long').reduce((s, p) => s + Number(p.weight || 0), 0);
  const totalShort = thesis.positions.filter(p => p.side === 'short').reduce((s, p) => s + Number(p.weight || 0), 0);
  const totalHedge = thesis.positions.filter(p => p.side === 'hedge').reduce((s, p) => s + Number(p.weight || 0), 0);

  if (editing) {
    return <ThesisForm initial={thesis} onSubmit={(patch) => onEditSave(patch)} onCancel={onEditCancel} />;
  }

  return (
    <article>
      <div className="flex items-start gap-4 mb-3">
        <button onClick={onToggle} className="mt-3 flex-shrink-0 btn-text" aria-label="toggle">
          <ChevronDown size={14} strokeWidth={1.5} style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 200ms ease' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5 flex-wrap">
              <h2 className="serif text-[30px] sm:text-[36px] leading-[1.05] text-stone-900 tracking-tight" style={{ fontWeight: 380 }}>
                {thesis.name}
              </h2>
              <ConvictionBar value={thesis.conviction} />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onEditStart} className="btn-text text-stone-500" aria-label="edit"><Pencil size={13} strokeWidth={1.5} /></button>
              <button onClick={onDelete} className="btn-text text-stone-500" aria-label="delete"><Trash2 size={13} strokeWidth={1.5} /></button>
            </div>
          </div>
          <div className="mt-2 sans text-[11px] tracking-[0.06em] text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{thesis.sector}</span>
            <span className="text-stone-300">·</span>
            <span className="uppercase tracking-[0.16em] text-[10px]" style={{ color: thesis.status === 'active' ? '#1a1a1a' : '#9a9485' }}>
              {thesis.status}
            </span>
            {thesis.cycleStage && (
              <>
                <span className="text-stone-300">·</span>
                <span className="uppercase tracking-[0.16em] text-[10px]" style={{ color: cycleStageColor(thesis.cycleStage) }}>
                  {formatCycleStage(thesis.cycleStage)}
                </span>
              </>
            )}
            <span className="text-stone-300">·</span>
            <span className="nums mono text-[10px]">{thesis.positions.length} positions</span>
            <span className="text-stone-300">·</span>
            <span className="nums mono text-[10px]">long {totalLong}%{totalHedge > 0 ? ` · hedge ${totalHedge}%` : ''}{totalShort > 0 ? ` · short ${totalShort}%` : ''}</span>
            {thesis.timing && (
              <>
                <span className="text-stone-300">·</span>
                <span className="italic" style={{ fontFamily: "'Fraunces', serif", fontSize: 12, color: '#6B6B66' }}>
                  {thesis.timing}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="pl-8">
          <p className="serif text-[18px] leading-[1.55] text-stone-700 mb-8" style={{ fontWeight: 350, maxWidth: '62ch' }}>
            {thesis.summary}
          </p>

          <div className="mb-2 hairline" />
          <div className="grid grid-cols-12 gap-3 sans text-[10px] tracking-[0.16em] text-stone-400 uppercase py-3">
            <div className="col-span-2">Ticker</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Weight</div>
            <div className="col-span-1">Side</div>
            <div className="col-span-2">Valuation</div>
            <div className="col-span-1"></div>
          </div>
          <div className="hairline" />

          {thesis.positions.map((p) => (
            <PositionRow key={p.id} position={p} onUpdate={(patch) => onUpdatePosition(p.id, patch)} onDelete={() => onDeletePosition(p.id)} />
          ))}

          {addingPos ? (
            <PositionRow
              position={{ ticker: '', name: '', weight: '', side: 'long', valuation: '', upside: null, notes: '' }}
              isNew
              onUpdate={async (patch) => {
                if (!patch.ticker) { setAddingPos(false); return; }
                await onAddPosition(patch);
                setAddingPos(false);
              }}
              onDelete={() => setAddingPos(false)}
            />
          ) : (
            <div className="py-3">
              <button onClick={() => setAddingPos(true)} className="btn-text sans text-[10px] tracking-[0.18em] text-stone-500 uppercase flex items-center gap-1.5">
                <Plus size={11} strokeWidth={1.5} /> Add position
              </button>
            </div>
          )}

          {thesis.hedgeNote && (
            <div className="mt-6 pl-3 border-l-2 sans text-[12px] leading-[1.6] text-stone-500 italic" style={{ borderColor: '#C9BFAB', maxWidth: '62ch' }}>
              {thesis.hedgeNote}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ConvictionBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = convictionColor(v);
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={`Conviction ${v}%`}>
      <span style={{ display: 'inline-block', width: 72, height: 2, background: '#D8CFBF', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, height: 2, width: `${v}%`, background: color, transition: 'width 200ms ease, background 200ms ease' }} />
      </span>
      <span className="mono nums" style={{ fontSize: 11, color, letterSpacing: '0.02em' }}>{v}%</span>
    </span>
  );
}

function PositionRow({ position, isNew, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(isNew || false);
  const [draft, setDraft] = useState(position);
  const tickerRef = useRef(null);

  useEffect(() => {
    if (editing && tickerRef.current) tickerRef.current.focus();
  }, [editing]);

  useEffect(() => { setDraft(position); }, [position]);

  if (editing) {
    return (
      <div className="py-3" style={{ background: '#ECE5D5' }}>
        <div className="grid grid-cols-12 gap-3 items-center px-1">
          <div className="col-span-2">
            <input
              ref={tickerRef}
              value={draft.ticker}
              onChange={(e) => setDraft({ ...draft, ticker: e.target.value.toUpperCase() })}
              placeholder="TICKER"
              className="mono text-[13px] bg-transparent w-full px-2 py-1 text-stone-900"
            />
          </div>
          <div className="col-span-4">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Company name"
              className="sans text-[13px] bg-transparent w-full px-2 py-1 text-stone-900"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              step="0.5"
              value={draft.weight}
              onChange={(e) => setDraft({ ...draft, weight: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="Weight %"
              className="mono nums text-[13px] bg-transparent w-full px-2 py-1 text-stone-900"
            />
          </div>
          <div className="col-span-1">
            <select
              value={draft.side}
              onChange={(e) => setDraft({ ...draft, side: e.target.value })}
              className="sans text-[12px] bg-transparent w-full px-1 py-1 text-stone-900"
            >
              {SIDE_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <input
              value={draft.valuation || ''}
              onChange={(e) => setDraft({ ...draft, valuation: e.target.value })}
              placeholder="e.g. 12x P/E"
              className="sans text-[12px] bg-transparent w-full px-2 py-1 text-stone-900"
            />
          </div>
          <div className="col-span-1 flex items-center gap-3 justify-end pr-2">
            <button onClick={async () => { await onUpdate(draft); setEditing(false); }} className="text-stone-700 btn-text" aria-label="save"><Check size={13} strokeWidth={1.5} /></button>
            <button onClick={() => { setDraft(position); setEditing(false); if (isNew) onDelete(); }} className="text-stone-500 btn-text" aria-label="cancel"><X size={13} strokeWidth={1.5} /></button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3 items-center px-1 mt-2">
          <div className="col-span-2">
            <div className="sans text-[9px] tracking-[0.12em] uppercase text-stone-500">Upside %</div>
            <input
              type="number"
              step="1"
              value={draft.upside === null || draft.upside === undefined ? '' : draft.upside}
              onChange={(e) => setDraft({ ...draft, upside: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="+18 / -10"
              className="mono nums text-[12px] bg-transparent w-full px-2 py-1 text-stone-900"
            />
          </div>
          <div className="col-span-9">
            <div className="sans text-[9px] tracking-[0.12em] uppercase text-stone-500">Notes</div>
            <input
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Why this position; thesis-specific commentary"
              className="sans text-[12px] bg-transparent w-full px-2 py-1 text-stone-700"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 row-hover cursor-pointer border-b" style={{ borderColor: '#E8E0CE' }} onClick={() => setEditing(true)}>
      <div className="grid grid-cols-12 gap-3 items-baseline">
        <div className="col-span-2 mono text-[13px] text-stone-900 font-medium">{position.ticker}</div>
        <div className="col-span-4 sans text-[13px] text-stone-700">{position.name}</div>
        <div className="col-span-2 flex items-center gap-2">
          <span className="mono nums text-[13px] text-stone-900">{position.weight}<span className="text-stone-400">%</span></span>
          <WeightBar weight={Number(position.weight)} side={position.side} />
        </div>
        <div className="col-span-1">
          <SideBadge side={position.side} />
        </div>
        <div className="col-span-2 flex flex-col">
          {position.valuation && (
            <span className="mono text-[11px] text-stone-700 leading-tight">{position.valuation}</span>
          )}
          {(position.upside !== null && position.upside !== undefined && position.upside !== '') && (
            <span className="mono nums text-[11px] leading-tight" style={{ color: upsideColor(position.upside) }}>
              {Number(position.upside) > 0 ? '+' : ''}{position.upside}%
            </span>
          )}
        </div>
        <div className="col-span-1 flex justify-end pr-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-stone-300 btn-text" aria-label="delete"><Trash2 size={12} strokeWidth={1.5} /></button>
        </div>
      </div>
      {position.notes && (
        <div className="mt-1.5 pl-[16.67%] sans text-[11px] text-stone-500 italic leading-snug" style={{ maxWidth: '90%' }}>
          {position.notes}
        </div>
      )}
    </div>
  );
}

function WeightBar({ weight, side }) {
  const w = Math.min(100, Math.max(0, Number(weight) || 0));
  const color = side === 'long' ? '#1a1a1a' : side === 'short' ? '#8B2E2E' : '#5D5C56';
  return (
    <div className="flex-1" style={{ height: 1, background: '#D8CFBF', maxWidth: 50 }}>
      <div style={{ height: 1, width: `${w}%`, background: color }} />
    </div>
  );
}

function SideBadge({ side }) {
  const styles = {
    long: { color: '#1a1a1a', label: 'LONG' },
    short: { color: '#8B2E2E', label: 'SHORT' },
    hedge: { color: '#5D5C56', label: 'HEDGE' },
  };
  const s = styles[side] || styles.long;
  return (
    <span className="sans text-[9px] tracking-[0.18em] font-medium" style={{ color: s.color }}>
      {s.label}
    </span>
  );
}

function ThesisForm({ initial, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(initial || {
    id: uid(),
    name: '',
    sector: '',
    conviction: 60,
    timing: '',
    status: 'active',
    cycleStage: 'secular',
    summary: '',
    hedgeNote: '',
    createdAt: new Date().toISOString().slice(0, 10),
    positions: [],
  });

  const submit = () => {
    if (!draft.name?.trim()) return;
    onSubmit(draft);
  };

  const convColor = convictionColor(draft.conviction);

  return (
    <article className="mb-12 p-6 sm:p-8" style={{ background: '#ECE5D5' }}>
      <div className="sans text-[10px] tracking-[0.22em] text-stone-500 uppercase mb-4">
        {initial ? 'Edit thesis' : 'New thesis'}
      </div>

      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="Thesis name"
        className="serif text-[34px] bg-transparent w-full text-stone-900 mb-4 pb-2"
        style={{ fontWeight: 380, borderBottom: '1px solid #C9BFAB' }}
        autoFocus
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
        <div>
          <Label>Sector</Label>
          <input
            value={draft.sector}
            onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
            placeholder="e.g. Healthcare × AI"
            className="sans text-[13px] bg-transparent w-full pb-1 text-stone-900"
            style={{ borderBottom: '1px solid #C9BFAB' }}
          />
        </div>
        <div>
          <Label>Status</Label>
          <select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            className="sans text-[13px] bg-transparent w-full pb-1 text-stone-900"
            style={{ borderBottom: '1px solid #C9BFAB' }}
          >
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Label>Cycle stage</Label>
          <select
            value={draft.cycleStage || 'secular'}
            onChange={(e) => setDraft({ ...draft, cycleStage: e.target.value })}
            className="sans text-[13px] bg-transparent w-full pb-1"
            style={{ borderBottom: '1px solid #C9BFAB', color: cycleStageColor(draft.cycleStage || 'secular') }}
          >
            {CYCLE_STAGE_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Label>Timing horizon</Label>
          <input
            value={draft.timing || ''}
            onChange={(e) => setDraft({ ...draft, timing: e.target.value })}
            placeholder="e.g. 12-18 months"
            className="sans italic text-[13px] bg-transparent w-full pb-1 text-stone-700"
            style={{ borderBottom: '1px solid #C9BFAB', fontFamily: "'Fraunces', serif" }}
          />
        </div>
      </div>

      <div className="mb-5">
        <Label>Conviction</Label>
        <div className="flex items-center gap-4 pb-2" style={{ borderBottom: '1px solid #C9BFAB' }}>
          <input
            type="range"
            min={0} max={100} step={5}
            value={draft.conviction}
            onChange={(e) => setDraft({ ...draft, conviction: Number(e.target.value) })}
            className="flex-1"
            style={{ '--thumb-color': convColor, accentColor: convColor }}
          />
          <span className="mono nums text-[13px]" style={{ color: convColor, minWidth: 44, textAlign: 'right' }}>
            {draft.conviction}%
          </span>
        </div>
        <div className="mt-1.5 sans text-[10px] tracking-[0.05em] text-stone-400 italic">
          {draft.conviction < 40 ? 'Speculative — watch only / very small size' :
           draft.conviction < 70 ? 'Directional — sized small to mid' :
           'Full conviction — size up'}
        </div>
      </div>

      <div className="mb-5">
        <Label>Summary</Label>
        <textarea
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          placeholder="The thesis in a paragraph. What's consensus, what's the contrarian view, what's the mechanism."
          rows={4}
          className="serif text-[16px] bg-transparent w-full pb-2 text-stone-700 resize-none"
          style={{ fontWeight: 350, borderBottom: '1px solid #C9BFAB', lineHeight: 1.55 }}
        />
      </div>

      <div className="mb-6">
        <Label>Hedge note (optional)</Label>
        <input
          value={draft.hedgeNote}
          onChange={(e) => setDraft({ ...draft, hedgeNote: e.target.value })}
          placeholder="e.g. Short XLU at 20% NAV to isolate the multiple-rerate"
          className="sans italic text-[13px] bg-transparent w-full pb-1 text-stone-700"
          style={{ borderBottom: '1px solid #C9BFAB' }}
        />
      </div>

      <div className="flex items-center gap-6">
        <button onClick={submit} className="sans text-[11px] tracking-[0.2em] uppercase text-stone-900 btn-text flex items-center gap-2">
          <Check size={12} strokeWidth={1.5} /> {initial ? 'Save changes' : 'Add thesis'}
        </button>
        <button onClick={onCancel} className="sans text-[11px] tracking-[0.2em] uppercase text-stone-500 btn-text">
          Cancel
        </button>
      </div>
    </article>
  );
}

function Label({ children }) {
  return <div className="sans text-[9px] tracking-[0.22em] text-stone-500 uppercase mb-1.5">{children}</div>;
}
