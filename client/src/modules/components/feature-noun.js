// The word for what a cohort measures, in the forms the interface needs:
// transcriptomics cohorts measure genes, proteomics cohorts proteins. Wording
// only — the data model, the state and the code call every feature a "gene"
// either way.
const NOUNS = {
  gene: { one: "gene", many: "genes", One: "Gene", Many: "Genes" },
  protein: {
    one: "protein",
    many: "proteins",
    One: "Protein",
    Many: "Proteins",
  },
};

export function featureNoun(name) {
  return NOUNS[name] ?? NOUNS.gene;
}

// "1 gene", "3 proteins"
export function countOf(n, noun) {
  return `${n} ${n === 1 ? noun.one : noun.many}`;
}
