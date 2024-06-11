docker stop beckhoff
docker rm beckhoff
docker stop mqtt
docker rm mqtt
docker image rm img_beckhoff
docker image rm img_mqtt
docker build -t img_beckhoff ./beckhoff
docker run --restart=always --name=beckhoff img_beckhoff
docker build -t img_mqtt ./mqtt
docker run --restart=always --name=mqtt img_mqtt