FROM node:20

# install system packages needed for OCR and pdf-poppler
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr

# create app folder
WORKDIR /app

# copy server package files
COPY server/package*.json ./

# install dependencies
RUN npm install

# copy server code
COPY server .

# create uploads folder
RUN mkdir uploads

# expose port
EXPOSE 5000

# start server
CMD ["node", "index.js"]