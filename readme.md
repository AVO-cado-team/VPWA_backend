# Silesig backend

## Explanation

In our application we return Result<Ok, Err> for the most cases. Err are cases that we expect to occur. But if something goes wrong we _throw_ error what mean that some core constraints of data model or axioms was broken.

## Axioms

- Database works. (This is why we dont wrap up Prisma calls with try/catch. If database drop application cannot work no more)
- JWT works with no errors. (Consequence of this axiom ??? => every userId we use in application layer is valid )

## Configuratio

DEV: 
- ___.env___ ENVIRONMENT = "development" && 
___docker-compose.yaml___ servicers -> service -> build -> dockerfile = "Dockerfile.dev"  
PROD: 
___.env___ ENVIRONMENT = "production" __&&__ 
___.env___ PORT = 443 (if you need https)
___docker-compose.yaml___ servicers -> service -> build -> dockerfile = "Dockerfile"  __&&__
___cert.pem___  in project directory with valid SSL certificate __&&__
___key.pem___ in project directory with valid SSL key __&&__
