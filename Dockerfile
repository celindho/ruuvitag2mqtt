FROM arm32v7/node:14.19.0

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

# RUN sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

COPY *.js ./
COPY forwarding_mode/ ./forwarding_mode/
COPY default_mode/ ./default_mode/

ENV config_folder="/config"

CMD ["node", "index.js"]
