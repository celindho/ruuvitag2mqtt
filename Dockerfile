FROM arm32v7/node:12.20.1

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        bluetooth \
        bluez \
        libbluetooth-dev \
        libudev-dev

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY *.js ./

CMD [ "node", "index.js" ]