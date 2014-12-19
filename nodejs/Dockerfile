FROM ubuntu:14.04
MAINTAINER ptqa

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get -y install wget libzmq3-dev curl npm ssh && \
    npm install -g chai sinon mocha proxyquire istanbul && \
    apt-get clean

RUN mkdir /root/.ssh/
COPY id_rsa.pub /root/.ssh/authorized_keys
EXPOSE 22
CMD /etc/init.d/ssh start && while true; do sleep 600; done;
