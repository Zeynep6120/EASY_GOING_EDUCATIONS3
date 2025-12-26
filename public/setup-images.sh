#!/bin/bash

# Resim klasörlerini oluştur
echo "Creating image directories..."
mkdir -p public/img/about
mkdir -p public/img/courses
mkdir -p public/img/events
mkdir -p public/img/instructors
mkdir -p public/img/logos
mkdir -p public/img/slider
mkdir -p public/img/errors

# Next.js projesindeki resimleri kopyala
SOURCE_DIR="/Users/zeynepozmen/Downloads/MODUL/easy-going-education/public/img"
DEST_DIR="public/img"

if [ -d "$SOURCE_DIR" ]; then
    echo "Copying images from Next.js project..."
    cp -r "$SOURCE_DIR"/* "$DEST_DIR"/
    echo "Images copied successfully!"
else
    echo "Source directory not found: $SOURCE_DIR"
    echo "Please update the SOURCE_DIR variable in this script."
fi

