import { useEffect } from "react";
import { Route, useLocation } from "react-router-dom";
import Home from "./modules/home/home";
import NCIClarity from "./modules/pages/nci-clarity";
import MultiRegional from "./modules/pages/multi-regional";
import Sequential from "./modules/pages/sequential";
import About from "./modules/about/about";
import AtlasSummary from "./modules/pages/atlas-summary";
import {
  SpatialTransMultiRegional,
  SpatialTransEuropean,
  SpatialTransTigerLc,
  SpatialProtTigerLcIcca,
  SpatialProtTigerLcHcc,
  SpatialProtLciHcc,
} from "./modules/pages/spatial/spatial-pages";

import "./styles/main.scss";
import WebglAlert from "./modules/components/webgl-alert";
import MainNav from "./modules/components/main-nav";

export default function App() {
  const { pathname } = useLocation();
  useEffect((_) => window.scrollTo(0, 0), [pathname]);

  return (
    <>
      <MainNav pathname={pathname} />
      <WebglAlert />

      <div id="content" className="bg-light flex-grow-auto">
        <Route exact path="/" component={Home} />

        <Route
          exact
          path="/single-cell"
          render={() => <AtlasSummary title="Single-Cell Atlas" />}
        />
        <Route
          exact
          path="/spatial"
          render={() => <AtlasSummary title="Spatial Atlas" />}
        />

        <Route exact path="/nci-clarity" component={NCIClarity} />
        <Route exact path="/multi-regional" component={MultiRegional} />
        <Route exact path="/sequential" component={Sequential} />

        <Route
          exact
          path="/spatial/transcriptomics/multi-regional"
          component={SpatialTransMultiRegional}
        />
        <Route
          exact
          path="/spatial/transcriptomics/european"
          component={SpatialTransEuropean}
        />
        <Route
          exact
          path="/spatial/transcriptomics/tiger-lc"
          component={SpatialTransTigerLc}
        />
        <Route
          exact
          path="/spatial/proteomics/tiger-lc-icca"
          component={SpatialProtTigerLcIcca}
        />
        <Route
          exact
          path="/spatial/proteomics/tiger-lc-hcc"
          component={SpatialProtTigerLcHcc}
        />
        <Route
          exact
          path="/spatial/proteomics/lci-hcc"
          component={SpatialProtLciHcc}
        />

        <Route exact path="/about" component={About} />
      </div>
    </>
  );
}
