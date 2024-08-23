#!/bin/bash

tcloVAll() {
  tcloArrays \
  tcloV_verser_paths \
  tcloV_verser_test_paths \
  tcloV_frontend_paths \
  tcloV_bash_paths 
}

tcloVFrontend() {
  tcloArrays tcloV_frontend_paths
}

tcloVBackendAll() {
  tcloArrays \
  tcloV_verser_paths \
  tcloV_verser_test_paths 
}

tcloVAllNoTests() {
  tcloArrays \
  tcloV_verser_paths \
  tclo_frontend_paths \
  tclo_bash_paths
}

# Function to run tclo with only bash paths
tcloVBash() {
  tcloArrays tcloV_bash_paths
}

tcloVApiJustRegistration() {
  tcloArrays tcloV_api_just_registration_paths
}

tcloVApi() {
  tcloArrays \
  tcloV_api_paths \
  tclo_api_test_paths \
  tcloV_api_related_paths\
  tcloV_bash_api_paths 
}

tcloVApiNoTests() {
  tcloArrays \
  tcloV_api_paths \
  tcloV_api_related_src_paths \
  tclo_bash_paths
}

tcloVbashTclo() {
  tcloArrays tcloV_bash_tclo_paths
}

tcloVbashApi() {
  tcloArrays tcloV_bash_api_paths
}

tcloVFrontendBashapi() {
  tcloArrays tcloV_frontend_paths \
  tcloV_bash_api_paths \
  tcloV_api_related_src_paths \
  tcloV_api_related_test_paths
}

tcloVApiRelated() {
  tcloArrays tcloV_api_related_paths
}

tcloV_api_related_test_paths=(
  "test/enrichVerseJson.test.js"
  "test/addDataToExtradata.test.js"
)

tcloV_api_related_src_paths=(
  "lib/verseManipulation/enrichVerseJson.mjs"
  "lib/verseManipulation/addDataToExtradata.mjs"
)

tcloV_api_related_paths=($(concatenateGlobalArrays tcloV_api_related_src_paths tcloV_api_related_test_paths))

tcloV_bash_api_paths=(
  "bash/api"
)

tcloV_bash_tclo_paths=(
  "bash/tclo"
)

tcloV_bash_paths=(
  "verser.sh"
  "bash"
)

tcloV_frontend_paths=(
  "frontend/vite-react/src"
  "frontend/vite-react/package.json"
  "frontend/vite-react/index.html"
  "frontend/vite-react/vite.config.js"
  "frontend/vite-react/index.html"
)


tcloV_verser_paths=(
  "verser.mjs"
  "processFiles.mjs"
  "jsconfig.json"
  "eslint.config.mjs"
  "translation"
  "lib"
)

tcloV_verser_test_paths=(
  "test"
)

tcloV_api_paths=(
  "configutationProcessor.mjs"
  "configurationProcessor"
  "lib/verseManipulation/enrichVerseJson.mjs"
  "lib/verseManipulation/addDataToExtradata.mjs"
)

tcloV_api_test_paths=(
  "test/enrichVerseJson.test.js"
  "test/addDataToExtradata.test.js"
)

tcloV_api_just_registration_paths=(
  "configurationProcessor/apiRoutes"
  "configurationProcessor/startApiServer.mjs"
)
