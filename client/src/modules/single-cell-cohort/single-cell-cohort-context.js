import { createContext, useContext } from "react";

// Carries one cohort's state bundle (from createSingleCellCohortState,
// including its config) to the composed page components, so the same
// components serve every single-cell cohort page without prop-drilling.
export const SingleCellCohortContext = createContext(null);

export function useSingleCellCohort() {
  return useContext(SingleCellCohortContext);
}
