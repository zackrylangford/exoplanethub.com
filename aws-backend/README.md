# AWS Backend

## Local Deployment

```bash
cd aws-backend
sam build
sam deploy --config-env dev  # or main
```

## Tests

```bash
cd aws-backend
pip install -r requirements-dev.txt
pytest
```

Tests import Lambda modules flat (`import esi`) — `pytest.ini` puts `lambda/sync` on the path.
They must run without network access or AWS credentials.

## GitHub Actions Deployment

Push a tag to trigger deployment:

```bash
# Deploy to dev
git tag dev-aws-backend-1.0.0
git push origin dev-aws-backend-1.0.0

# Deploy to main
git tag main-aws-backend-1.0.0
git push origin main-aws-backend-1.0.0
```

## Required GitHub Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
