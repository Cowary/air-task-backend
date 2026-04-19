// Jenkinsfile для сборки и пуша air-task-front в Docker
// Используется Docker Pipeline синтаксис

pipeline {
    // Агент, на котором выполняется сборка
    agent any

    tools {
        maven 'Maven 3.9.11'
        dockerTool 'docker'
    }

    // Параметры сборки
    parameters {
         gitParameter(
             name: 'BRANCH_NAME',
             type: 'PT_BRANCH',
             defaultValue: 'master',
             branchFilter: 'origin/(.*)',
             sortMode: 'DESCENDING_SMART',
             description: 'Select branch to build and deploy',
             selectedValue: 'DEFAULT',
             listSize: '0'
         )

        string(
            name: 'DOCKER_REGISTRY', 
            defaultValue: 'cowary', 
            description: 'Docker registry (пользователь или организация)'
        )

        string(
            name: 'DOCKER_TAG', 
            defaultValue: 'latest', 
            description: 'Тег образа'
        )
        string(
            name: 'BACKEND_URL', 
            defaultValue: 'http://localhost:8090', 
            description: 'URL backend сервера'
        )
    }

    // Переменные окружения
    environment {
        DOCKER_IMAGE = "${params.DOCKER_REGISTRY}/${params.IMAGE_NAME}"

        // === Docker Registry (Forgejo) ===
        REGISTRY        = '192.168.1.77:3002'
        REGISTRY_USER   = 'cowary'
        REGISTRY_CREDS  = 'forgejo-credentials'

        // === Image Names & Tags ===
        IMAGE_NAME      = 'air-task-front'
        IMAGE_TAG       = 'latest'
        FULL_IMAGE      = "${REGISTRY}/${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
        DHUB_IMAGE      = "${DHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
    }

    // Этапы сборки
    stages {
        // Очистка рабочей директории
        stage('Clean') {
            steps {
                echo 'Очистка рабочей директории...'
                cleanWs()
            }
        }

        // Получение исходного кода
        stage('Checkout') {
            steps {
                checkout scm: [
                    $class: 'GitSCM',
                    branches: [[name: "${params.BRANCH_NAME}"]],
                    userRemoteConfigs: [[url: 'http://192.168.1.77:3002/cowary/air-task-front.git']]
                ]
            }
        }

        // Сборка Docker образа
        stage('Build Docker Image') {
            steps {
                echo "Сборка образа ${DOCKER_IMAGE}:${params.DOCKER_TAG}..."
                script {
                    def buildArgs = ""
                    if (params.BACKEND_URL != 'http://localhost:8090') {
                        buildArgs = "--build-arg BACKEND_URL=${params.BACKEND_URL}"
                    }
                    
                    sh """
                        docker build \
                            ${buildArgs} \
                            -t ${DOCKER_IMAGE}:${params.DOCKER_TAG} \
                            -t ${DOCKER_IMAGE}:${env.BUILD_NUMBER} \
                            .
                    """
                }
            }
        }

//        // Логин в Docker Hub
//        stage('Docker Login') {
//            when {
//                expression { env.DOCKER_HUB_CREDENTIALS_ID != null }
//            }
//            steps {
//                echo 'Вход в Docker Hub...'
//                withCredentials([usernamePassword(
//                    credentialsId: env.DOCKER_HUB_CREDENTIALS_ID ?: 'docker-hub',
//                    usernameVariable: 'DOCKER_HUB_USER',
//                    passwordVariable: 'DOCKER_HUB_PASS'
//                )]) {
//                    sh 'echo $DOCKER_HUB_PASS | docker login -u $DOCKER_HUB_USER --password-stdin'
//                }
//            }
//        }
//
//        // Пуш образа в registry
//        stage('Push Image') {
//            steps {
//                echo "Пуш образа ${DOCKER_IMAGE}:${params.DOCKER_TAG}..."
//                sh """
//                    docker push ${DOCKER_IMAGE}:${params.DOCKER_TAG}
//                    docker push ${DOCKER_IMAGE}:${env.BUILD_NUMBER}
//                """
//            }
//        }
        stage('Tag & Push to Forgejo Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: env.REGISTRY_CREDS,
                    usernameVariable: 'REG_USER',
                    passwordVariable: 'REG_PASS'
                )]) {
                    sh """
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${FULL_IMAGE}

                        echo "\${REG_PASS}" | docker login ${REGISTRY} \
                            -u "\${REG_USER}" \
                            --password-stdin

                        docker push ${FULL_IMAGE}

                        docker logout ${REGISTRY}
                    """
                }
            }
        }


        // Удаление локальных образов для очистки
        stage('Cleanup') {
            steps {
                echo 'Очистка локальных образов...'
                sh """
                    docker rmi ${DOCKER_IMAGE}:${params.DOCKER_TAG} || true
                    docker rmi ${DOCKER_IMAGE}:${env.BUILD_NUMBER} || true
                """
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
            sh "docker rmi ${FULL_IMAGE} || true"
        }
        success {
            echo "✅ Frontend build, push and deploy successful!"
        }
        failure {
            echo "❌ Frontend build or deploy failed."
        }
    }}
