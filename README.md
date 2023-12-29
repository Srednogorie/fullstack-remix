# fullstack-remix

# Run production build
docker build -t my-app-frontend:latest -f front.fargate.Dockerfile .
docker run -p 3000:3000 -it --rm my-app-frontend
