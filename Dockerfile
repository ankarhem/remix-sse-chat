### Build Step
# pull the Node.js Docker image
FROM node:alpine3.16 as builder
# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Install build dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Bundle app source
COPY . .
# # build the application
# RUN pnpm build

# Only works in dev 🤔
CMD ["pnpm", "dev"]

# FROM node:alpine3.16
# # Install pnpm
# RUN npm install -g pnpm

# WORKDIR /usr/src/app

# # Install production dependencies
# COPY --from=builder /usr/src/app/package.json /usr/src/app/pnpm-lock.yaml ./
# RUN pnpm install --prod --frozen-lockfile
# COPY --from=builder /usr/src/app/build ./build

# EXPOSE 3000

# ENV NODE_ENV=production
# CMD ["pnpm", "start"]