import { createContext, useContext } from "react";

// Carries one cohort's state bundle (from createSpatialCohortState, including
// its config) to the composed page components, so the same components serve
// every spatial cohort page without prop-drilling.
export const SpatialCohortContext = createContext(null);

export function useSpatialCohort() {
  return useContext(SpatialCohortContext);
}
