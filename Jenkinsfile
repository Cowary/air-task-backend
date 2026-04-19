// Jenkinsfile для сборки и пуша air-task-front в Docker
// Используется Docker Pipeline синтаксис

pipeline {
    // Агент, на котором выполняется сборка
    agent any



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
            name: 'IMAGE_NAME', 
            defaultValue: 'air-task-front', 
            description: 'Название образа'
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

        // Логин в Docker Hub
        stage('Docker Login') {
            when {
                expression { env.DOCKER_HUB_CREDENTIALS_ID != null }
            }
            steps {
                echo 'Вход в Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: env.DOCKER_HUB_CREDENTIALS_ID ?: 'docker-hub',
                    usernameVariable: 'DOCKER_HUB_USER',
                    passwordVariable: 'DOCKER_HUB_PASS'
                )]) {
                    sh 'echo $DOCKER_HUB_PASS | docker login -u $DOCKER_HUB_USER --password-stdin'
                }
            }
        }

        // Пуш образа в registry
        stage('Push Image') {
            steps {
                echo "Пуш образа ${DOCKER_IMAGE}:${params.DOCKER_TAG}..."
                sh """
                    docker push ${DOCKER_IMAGE}:${params.DOCKER_TAG}
                    docker push ${DOCKER_IMAGE}:${env.BUILD_NUMBER}
                """
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

    // Пост-этап: выполняется после всех stages
    post {
        success {
            echo 'Сборка успешно завершена!'
            // Можно добавить уведомление в Slack, Telegram и т.д.
        }
        failure {
            echo 'Сборка завершена с ошибками!'
        }
        always {
            // Всегда выходим из Docker Hub
            sh 'docker logout || true'
        }
    }
}
