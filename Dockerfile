FROM node:20.2 as build

WORKDIR /app/

COPY [ "package.json", "package-lock.json",  "./" ]
RUN [ "npm", "ci", "--force" ]
RUN [ "npm", "audit", "fix", "--force" ]

COPY [ "./src/infrastructure/prisma", "./src/infrastructure/prisma" ]
RUN  [ "npm", "run", "db-generate" ]

COPY [ "./src/infrastructure/protos", "./src/infrastructure/protos" ]
RUN  [ "npm", "run", "generate-grpc" ]

COPY [ "./src", "./src" ]
COPY [ "tsconfig.json", "./" ]
RUN  [ "npm", "run", "compile" ]

RUN [ "cp", "-r", "./src/infrastructure/prisma/", "./build/infrastructure/prisma/" ] 
RUN [ "npm", "prune", "--omit=dev", "--omit-peer" ]
RUN [ "rm", "-rf", "./src", "./tsconfig.json" ]


FROM node:20.2 as prod
ENV NODE_ENV=production

USER root
RUN [ "mkdir", "-p", "~/logs/" ]

WORKDIR /app/

COPY --from=build --chown=node:node [ "/app/", "/app/" ]
RUN [ "mv", "./build", "./src" ]
COPY [ "key.pem", "cert.pem", "./" ]

USER node

CMD [ "npm", "run", "production" ]

