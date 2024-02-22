<!-- Read here first -->
1. create new remix app and copy whatever you need from v3
2. the backend is so minimalistic that I decided not to clear it up,
remove the things you don't need.
3. Look for env files in the local expenses folder, the frontend file is in the root of the project
4. Look at the instructions below

# fullstack-remix

<!-- Backend -->
1. Optional - Create local certificates, they can be used for every next local project
mkcert -cert-file local-docker-cert.pem -key-file local-docker-key.pem "docker.localhost" "*.docker.localhost" "domain.local" "*.domain.local" "127.0.0.1" "0.0.0.0"

2. Choose name of your app, update settings.py, pyproject.toml and .env(POSTGRES_DB) using the same name.
3. Create .env.dev fille and setup env variables, you will need at least BD_USER, BD_PASSWORD, DB_PORT & DB_ADDRESS.
4. If using vscode in launch.json use the following snippet.
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Remote Attach",
            "type": "python",
            "request": "attach",
            "port": 5678,
            "host": "localhost",
            "pathMappings": [
                {
                    "localRoot": "${workspaceFolder}",
                    "remoteRoot": "."
                }
            ]
        }
    ]
}
5. run "docker compose up development" then start the vscode launch configuration. The project is now available through https at port 8000

<!-- Frontend -->
Crate new project in the frontend folder - npx create-remix@latest --template remix-run/remix/templates/express
1. Setup local ssl in server.js
2. Setup tailwind - https://remix.run/docs/en/main/styling/tailwind
3. Add types.ts to the app folder
4. Edit package.json

<!-- Deployment -->
AWS Lambda Deploy
1. In workflows deploy_lambda_application.yml update applicationName. Use hyphens i.e "application-name". This will be used to prefix the ECR clusters also for a name of the ECR repository.
2. In deploy/parameters.json update ApplicationName parameter, keep it consistent with the action, it is used across
the stack templates.
