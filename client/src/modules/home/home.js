import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function Home() {
    return (
        <Container className="h-100">
            <Card className="h-100 shadow rounded-0">
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <img src="images/home.svg" className="img-fluid" alt="Home Page Figure" />
                        </Col>

                        <Col md={6}>
                            <h3>About scAtlasLC</h3>
                            <p>
                                scAtlasLC (Single-cell ATLAS in Liver Cancer) is a publicly available data portal of single-cell transcriptomic profiles of tumor cell communities in hepatocellular carcinoma and intrahepatic cholangiocarcinoma
                            </p>

                            <p>
                                scAtlasLC can be used to evaluate gene expression in malignant cells and various non-malignant cells in liver cancer. It can be further used to determine gene expression in different subtypes of stromal cells and immune cells.
                            </p>
                        </Col>

                    </Row>

                    <div class="pt-3">
                        <div class="container">
                            <p class="h6">Citing scAtlasLC </p>
                            <ol>
                                <li>Ma L, Wang L, et al., Single-cell atlas of tumor cell evolution in response to therapy in hepatocellular carcinoma and intrahepatic cholangiocarcinoma. Journal of Hepatology. 2021. In Revision. <a class="text-decoration-underline" href="https://www.biorxiv.org/content/10.1101/2020.08.18.254748v1" target="_blank">bioRxiv</a></li>
                                <li>Ma L, Hernandez MO, et al., <a class="text-decoration-underline" href="https://www.cell.com/cancer-cell/fulltext/S1535-6108(19)30375-7" target="_blank">Tumor cell biodiversity drives microenvironmental reprogramming in liver cancer</a>. Cancer Cell 36(4): 418-430.e416, 2019.</li>
                                <li>Ma L, Khatib S, Craig AJ and Wang XW, Toward a liver cell atlas: understanding liver biology in health and disease at single-cell resolution. Seminars in Liver Disease. 2021. In Press.</li>
                                <li>Heinrich S, Craig AJ, Ma L, Heinrich B, Greten TF, Wang XW, <a class="text-decoration-underline" href="https://www.journal-of-hepatology.eu/article/S0168-8278(20)33823-X/fulltext" target="_blank">Understanding tumor cell heterogeneity and its implication for immunotherapy in liver cancer by single cell analysis</a>. 2020 Nov 30.</li>
                            </ol>
                                scAtlasLC is developed by Lichun Ma at <a class="text-decoration-underline" href="https://ccr.cancer.gov/Laboratory-of-Human-Carcinogenesis/xin-wei-wang" target="_blank">Liver Carcinogenesis Section</a>.
                            </div>
                    </div>
                </Card.Body>
            </Card>
        </Container>

    );
}