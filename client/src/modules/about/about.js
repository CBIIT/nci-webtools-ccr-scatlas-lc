import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";

export default function About() {
  return (
    <Container className="h-100">
      <Card className="h-100 shadow rounded-0">
        <Card.Body>
          <h2 className="text-primary h4">Parameters</h2>
          <Table bordered hover>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Description</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cell Size</td>
                <td>The size of the dots in a plot. Default value is 4.</td>
                <td>Set to 6 to increase the size of the dots.</td>
              </tr>
              <tr>
                <td>Cell Opacity</td>
                <td>
                  The opacity of the dots in a plot. Default value is 0.8.
                </td>
                <td>Set to 0.1 to increase transparency of the dots.</td>
              </tr>
              <tr>
                <td>Gene</td>
                <td>Enter a gene.</td>
                <td>
                  Enter EPCAM to generate plots of the expression in malignant
                  cells and non-malignant cells.
                </td>
              </tr>
              <tr>
                <td>% Cells Expressing (Malignant)</td>
                <td>
                  The proportion of cells in expressing a given gene in
                  malignant cells.
                </td>
                <td>
                  SPP1 was expressed in 54.7% of the malignant cells in the
                  NCI-CLARITY cohort.
                </td>
              </tr>
              <tr>
                <td>Normalized Expression Levels (Malignant)</td>
                <td>
                  The average expression of a given gene in malignant cells.
                </td>
                <td>
                  The mean expression of SPP1 in malignant cells is 1.16 in the
                  NCI-CLARITY cohort.
                </td>
              </tr>
              <tr>
                <td>% Cells Expressing (Non-Malignant)</td>
                <td>
                  The proportion of cells in expressing a given gene in
                  non-malignant cells.
                </td>
                <td>
                  SPP1 was expressed in 18% of the non-malignant cells in the
                  NCI-CLARITY cohort.
                </td>
              </tr>
              <tr>
                <td>Normalized Expression Levels (Non-Malignant)</td>
                <td>
                  The average expression of a given gene in non-malignant cells.
                </td>
                <td>
                  The mean expression of SPP1 in non-malignant cells is 0.42 in
                  the NCI-CLARITY cohort.
                </td>
              </tr>
              <tr>
                <td>% Cells Expressing (T cells)</td>
                <td>
                  The proportion of cells in expressing a given gene in T cells.
                </td>
                <td>
                  GZMB was expressed in 13% of the T cells in the NCI-CLARITY
                  cohort.
                </td>
              </tr>
              <tr>
                <td>Normalized Expression Level (T Cells)</td>
                <td>The average expression of a given gene in T cells.</td>
                <td>
                  The mean expression of GZMB in T cells is 0.28 in the
                  NCI-CLARITY cohort.
                </td>
              </tr>
              <tr>
                <td>Enter gene</td>
                <td>Enter a gene</td>
                <td>Enter CD68 to search for the gene.</td>
              </tr>
              <tr>
                <td>Enter min percent</td>
                <td>
                  Filter genes by the expression in a minimum proportion of
                  cells.
                </td>
                <td>
                  Enter 20 to filter genes that were expressed in at least 20%
                  of the cells.
                </td>
              </tr>
              <tr>
                <td>Enter max percent</td>
                <td>
                  Filter genes by the expression in a maximum proportion of
                  cells.
                </td>
                <td>
                  Enter 50 to filter genes that were expressed in at most 50% of
                  the cells.
                </td>
              </tr>
              <tr>
                <td>Enter min mean</td>
                <td>Filter genes by a minimum average expression.</td>
                <td>
                  Enter 1 to filter genes with a minimum average expression of
                  1.
                </td>
              </tr>
              <tr>
                <td>Enter max mean</td>
                <td>Filter genes by a maximum average expression.</td>
                <td>
                  Enter 2 to filter genes with a maximum average expression of
                  2.
                </td>
              </tr>
              <tr>
                <td>Create new</td>
                <td>
                  <ul className="mb-0 ps-3">
                    <li>
                      Create a gene list to explore gene expression profiles.
                    </li>
                    <li>
                      View the spatial distribution of the average expression of
                      the entire gene list by clicking the water drop icon next
                      to the gene set name.
                    </li>
                    <li>
                      Explore the expression profile of an individual gene by
                      clicking the button to the left of the gene name.
                    </li>
                    <li>
                      Add additional genes to the list using the 'Add gene' box.
                    </li>
                    <li>
                      Remove a gene from the list by clicking the '×' button to
                      the right of the gene name.
                    </li>
                  </ul>
                </td>
                <td>
                  <ul className="mb-0 ps-3">
                    <li>
                      Set Name as Gene Set 1 and input GLUL, EPCAM in Genes
                      (optional box)
                    </li>
                    <li>
                      Click on the water drop button beside Gene Set 1 to
                      explore the spatial distribution of average expression of
                      the GLUL and EPCAM.
                    </li>
                    <li>
                      Click on the water drop button beside GLUL to explore the
                      spatial distribution of expression of the GLUL.
                    </li>
                    <li>Enter SPP1 in Add gene box to add SPP1 to Gene Set 1.</li>
                    <li>
                      Click on the x button right beside GLUL to remove GLUL
                      from Gene Set 1.
                    </li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td>MeanExpression_*</td>
                <td>
                  The average expression of a given gene in the specific cell
                  type.
                </td>
                <td>
                  The mean expression of CD31 in TAMs is 16.15 in the LCI HCC
                  (spatial proteomics) cohort.
                </td>
              </tr>
              <tr>
                <td>PercentageExpression_*</td>
                <td>
                  The proportion of cells in expressing a given gene in the
                  specific cell type.
                </td>
                <td>
                  CD31 was expressed in 1.4% of the TAMs LCI HCC (spatial
                  proteomics) cohort.
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
