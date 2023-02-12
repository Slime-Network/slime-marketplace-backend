# Use Node v8.9.0 LTS
FROM node:18.13.0

# Setup app working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN yarn

# Copy sourcecode
COPY . .

# Start app
CMD [ "yarn", "start" ]
