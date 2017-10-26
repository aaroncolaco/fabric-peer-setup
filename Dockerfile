FROM node:boron

# install hyperledger prerequisites
ENV VERSION=1.0.3
ENV ARCH=linux-amd64
RUN curl https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/${ARCH}-${VERSION}/hyperledger-fabric-${ARCH}-${VERSION}.tar.gz | tar xz

# Create dir to write peer data(files)
RUN mkdir -p /usr/src/fabric-peers

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Set environment to production
ENV NODE_ENV production

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
