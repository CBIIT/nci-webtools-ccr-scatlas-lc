import { hasWebglSupport } from "../../services/plot";

export default function WebglAlert() {
  const hasWebgl = hasWebglSupport();

  if (hasWebgl) return null;

  return (
    <div className="container my-4">
      <div className="alert alert-danger" role="alert">
        <div className="row">
          <div className="col-auto">
            <i className="bi bi-exclamation-triangle-fill text-danger h4" />
          </div>

          <div className="col">
            <h4 className="alert-heading">WebGL Is Not Enabled</h4>
            <p>
              WebGL is not enabled in your browser. Please follow the
              instructions below to "use hardware acceleration when available".
            </p>
            <div className="fw-bold">Chrome</div>
            <ol>
              <li>Go to: chrome://settings/system</li>
              <li>Enable: Use hardware acceleration when available</li>
            </ol>

            <div className="fw-bold">Edge</div>
            <ol>
              <li>Go to: edge://settings/system</li>
              <li>Enable: Use hardware acceleration when available</li>
            </ol>

            <div className="fw-bold">Firefox</div>
            <ol>
              <li>Go to: about:preferences#general</li>
              <li>Enable: Use recommended performance settings</li>
              <li>Enable: Use hardware acceleration when available</li>
            </ol>

            <div className="fw-bold">Safari</div>
            <ol>
              <li>Go to: Safari, Settings, Advanced</li>
              <li>
                Enable: Use hardware acceleration (automatically enabled in
                newer versions of Safari)
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
