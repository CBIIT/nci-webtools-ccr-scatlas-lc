# [scAtlasLC](https://scatlaslc.ccr.cancer.gov/)

scAtlasLC (single-cell Atlas in Liver Cancer) is a publicly available data portal of single-cell transcriptomic profiles of tumor cell communities in hepatocellular carcinoma and intrahepatic cholangiocarcinoma.

scAtlasLC can be used to evaluate gene expression in malignant cells and various non-malignant cells in liver cancer. It can be further used to determine gene expression in different subtypes of stromal cells and immune cells.

Current single-cell data used for scAtlasLC includes the following:
NCI-CLARITY (GSE151530). This cohort includes single cell transcriptomic profiles of 52,789 cells derived from 46 hepatocellular carcinoma (HCC) and intrahepatic cholangiocarcinoma (iCCA) biopsies of 37 patients.
Multi-Regional (GSE189903). This cohort consists of 112,506 cells from four HCC patients and three iCCA patients. For each tumor, single cells from five separate regions, i.e., three tumor cores (T1, T2, and T3), one tumor border (B) and an adjacent normal tissue (N), were prepared. A total of 34 samples were included in this study.
Sequential NCI-CLARITY (GSE229772). This cohort consists of 57,567 cells from nine HCC patients and two iCCA patients. Tumor biopsies were collected longitudinally, with two to five samples for each patient. Overall, 31 samples were collected across all patients.

## CI/CD Pipeline

### Overview
The application uses GitHub Actions for continuous integration and deployment to AWS ECS (Elastic Container Service). The deployment pipeline is containerized using Docker, with separate containers for the frontend (Apache/React) and backend (Node.js) services.

### Environment Mapping

The pipeline supports four deployment tiers that map to different AWS environments:

| Tier | Environment | Image Tag | Description |
|------|-------------|-----------|-------------|
| `dev` | Development | `development-*-latest` | Development environment for testing features |
| `qa` | Quality Assurance | `development-*-latest` | QA testing environment |
| `stage` | Staging | `release-*-latest` | Pre-production staging environment |
| `prod` | Production | `release-*-latest` | Production environment |

**Image Tier Mapping:**
- `dev` and `qa` → use `development` image tags
- `stage` and `prod` → use `release` image tags

### Deployment Workflow

#### Manual Deployment
Deployments are triggered manually via `workflow_dispatch` in GitHub Actions:

1. Navigate to **Actions** → **scAtlasLC Deploy**
2. Click **Run workflow**
3. Select the target tier: `dev`, `qa`, `stage`, or `prod`
4. Optional: Enable `no_cache` to force a clean build without Docker layer caching

#### Branch-Based Deployment (Automated)
The pipeline can automatically determine the deployment tier based on branch naming:
- Branch ending with `_dev` → deploys to `dev` environment
- Other branches → deploys to `qa` environment

### Deployment Process

The deployment workflow performs the following steps:

1. **Environment Setup**
   - Determines deployment tier (from manual input or branch name)
   - Sets image tier (`development` or `release`) based on target tier
   - Generates Git tags and timestamp for image versioning
   - Configures ECR repository URLs

2. **AWS Authentication**
   - Assumes IAM role via GitHub OIDC: `github-actions-cicd`
   - Retrieves environment-specific parameters from AWS Systems Manager Parameter Store:
     - ECS cluster name
     - ECS task definition and service names
     - CPU and memory allocations
     - IAM role ARNs
     - EFS filesystem configuration

3. **Docker Image Build & Push**
   - Builds backend image using [docker/backend.dockerfile](docker/backend.dockerfile)
   - Builds frontend image using [docker/frontend.dockerfile](docker/frontend.dockerfile)
   - Tags images with both timestamp and `latest` tags
   - Pushes to AWS ECR (Elastic Container Registry)
   - Uses Docker layer caching for faster builds (unless `no_cache` is enabled)

4. **Task Definition Registration**
   - Renders ECS task definition from template ([.github/aws/web.yml](.github/aws/web.yml))
   - Substitutes environment-specific variables
   - Registers new task definition with AWS ECS

5. **Service Deployment**
   - Updates ECS service with new task definition
   - Forces new deployment to pull latest images
   - Waits for service to stabilize (all tasks healthy)

6. **Cleanup**
   - Deregisters old task definitions (keeps 3 most recent)

### Container Architecture

The application runs as a multi-container ECS task on AWS Fargate:

| Container | Purpose | Port | Image |
|-----------|---------|------|-------|
| `frontend` | Apache HTTP server serving React app | 80 | ECR: `{tier}-frontend-latest` |
| `backend` | Node.js API server | 9000 | ECR: `{tier}-backend-latest` |
| `logs` | AWS FireLens log router (Fluent Bit) | - | AWS public ECR |

**Networking:**
- Frontend proxies API requests to `http://localhost:9000` (backend container)
- Containers communicate via `localhost` within the same task (awsvpc network mode)
- EFS volume mounted at `/data` for persistent storage

**Logging:**
- Logs are routed to Datadog via FireLens
- Separate log sources for frontend (`httpd`) and backend (`nodejs`)
- CloudWatch Logs used for FireLens container logs

### Configuration Management

Environment-specific configuration is managed via AWS Systems Manager Parameter Store:

**Parameter Path:** `/analysistools/{tier}/scatlaslc/`

**Key Parameters:**
- Application settings: `application_name`, `application_path`, `base_url`
- Infrastructure: `vpc_id`, `subnet_ids`, `security_group_ids`
- ECS resources: `ecs_cluster`, `ecs_web_task`, `ecs_web_service`
- Storage: `database_path`, EFS configuration
- Monitoring: Datadog API keys and log endpoints

### Rollback Procedure

To rollback a deployment:

1. Identify the previous task definition revision:
   ```bash
   aws ecs list-task-definitions --family-prefix <TIER>-scatlaslc-web --sort DESC
   ```

2. Update the service to use the previous revision:
   ```bash
   aws ecs update-service \
     --cluster <CLUSTER_NAME> \
     --service <SERVICE_NAME> \
     --task-definition <PREVIOUS_TASK_DEFINITION>
   ```

3. Wait for deployment to stabilize:
   ```bash
   aws ecs wait services-stable --cluster <CLUSTER_NAME> --services <SERVICE_NAME>
   ```

### Security

- **Authentication:** GitHub Actions uses OIDC for AWS authentication (no long-lived credentials)
- **Secrets:** Stored in AWS Systems Manager Parameter Store with encryption
- **Container Images:** Scanned for vulnerabilities (Trivy - currently disabled, can be enabled)
- **IAM Roles:** Task execution and task roles follow principle of least privilege
- **Network:** Containers run in private subnets with security group controls