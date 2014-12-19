FROM ubuntu:14.04
MAINTAINER ptqa
RUN apt-get update && apt-get install -y wget libssl0.9.8 && \
    wget http://s3.amazonaws.com/downloads.basho.com/riak/1.1/1.1.4/riak_1.1.4-1_amd64.deb -P /tmp && \
    dpkg -i /tmp/riak_1.1.4-1_amd64.deb && apt-get clean && rm /tmp/riak_1.1.4-1_amd64.deb

COPY ./app.config /etc/riak/
COPY ./riakjs/ /etc/riak/riakjs

EXPOSE 10098 10099
CMD /etc/init.d/riak start && tailf .
