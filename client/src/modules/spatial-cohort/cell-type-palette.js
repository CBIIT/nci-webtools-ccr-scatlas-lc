// The cell-type colors of every spatial cohort page: one set of 14, the number
// of types on the page with the most (TIGER-LC HCC proteomics). No page uses a
// color from outside it.
//
// A type that recurs across cohorts has the same color on every page — and a
// cohort's broader type (Stromal, Immune) takes the color of the lineage it
// stands for — so those colors are named below for what they mean. A type
// found on one panel only takes a color nothing else on its page is using:
// one of the spare colors, or the color of a type its cohort lacks.
export const RED = "#EE2C2C";
export const BLUE = "#3A5FCD";
export const ORANGE = "#FF8C00";
export const GREEN = "#32CD32";
export const CYAN = "#17BECF";
export const PURPLE = "#9467BD";
export const TEAL = "#008B8B";
export const MAGENTA = "#8B008B";
export const GRAY = "#A9A9A9";
// spare: no recurring type owns these
export const PINK = "#E377C2";
export const OLIVE = "#BCBD22";
export const GOLD = "#FFD700";
export const NAVY = "#1A237E";
export const BROWN = "#654321";

export const MALIGNANT = RED;
export const EPITHELIAL = BLUE;
export const ENDOTHELIAL = ORANGE; // Endothelial, TEC
export const FIBROBLAST = GREEN; // Fibroblast, CAF, Stromal
export const T_CELL = CYAN; // T cell, Lymphocyte
export const B_CELL = PURPLE;
// a cool color, so it cannot be mistaken for the endothelial orange it sits
// beside on most pages
export const MACROPHAGE = TEAL; // Macrophage, TAM, Myeloid
// immune cells not typed further: a cohort's Immune, Other Immune cells, the
// pan-immune CD45+ cluster
export const IMMUNE = MAGENTA;
export const UNCLASSIFIED = GRAY; // Unknown, Unclassified
