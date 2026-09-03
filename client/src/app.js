import { useEffect } from "react";
import { Route, useLocation } from "react-router-dom";
import Home from "./modules/home/home";
import NCIClarity from "./modules/pages/nci-clarity";
import MultiRegional from "./modules/pages/multi-regional";
import Sequential from "./modules/pages/sequential";
import About from "./modules/about/about";
import SingleCellSummary from "./modules/pages/single-cell-summary";
import SpatialSummary from "./modules/pages/spatial-summary";
import TigerLcPage from "./modules/pages/spatial/tiger-lc";
import SpatialMultiRegionalPage from "./modules/pages/spatial/multi-regional";
import CodexTigerLcIccaPage from "./modules/pages/spatial/codex-tigerlc-icca";
import EuropeanIccaPage from "./modules/pages/spatial/european-icca";
import CodexTigerLcHccPage from "./modules/pages/spatial/codex-tigerlc-hcc";
import CodexLciHccPage from "./modules/pages/spatial/codex-lci-hcc";

import "./styles/main.scss";
import WebglAlert from "./modules/components/webgl-alert";
import MainNav from "./modules/components/main-nav";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <MainNav pathname={pathname} />
      <WebglAlert />

      <div id="content" className="bg-light flex-grow-auto">
        <Route exact path="/" component={Home} />

        <Route exact path="/single-cell" component={SingleCellSummary} />
        <Route exact path="/spatial" component={SpatialSummary} />

        <Route exact path="/nci-clarity" component={NCIClarity} />
        <Route exact path="/multi-regional" component={MultiRegional} />
        <Route exact path="/sequential" component={Sequential} />

        <Route
          exact
          path="/spatial/transcriptomics/multi-regional"
          component={SpatialMultiRegionalPage}
        />
        <Route
          exact
          path="/spatial/transcriptomics/european"
          component={EuropeanIccaPage}
        />
        <Route
          exact
          path="/spatial/transcriptomics/tiger-lc-icca"
          component={TigerLcPage}
        />
        <Route
          exact
          path="/spatial/proteomics/tiger-lc-icca"
          component={CodexTigerLcIccaPage}
        />
        <Route
          exact
          path="/spatial/proteomics/tiger-lc-hcc"
          component={CodexTigerLcHccPage}
        />
        <Route
          exact
          path="/spatial/proteomics/lci-hcc"
          component={CodexLciHccPage}
        />

        <Route exact path="/about" component={About} />
      </div>
    </>
  );
}
