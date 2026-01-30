package org.cowary.airtaskbackend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.commons.lang3.StringUtils;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.cowary.airtaskbackend.api.planko.*;
import org.cowary.airtaskbackend.invoker.planko.ApiClient;
import org.cowary.airtaskbackend.model.planko.CreateAccessTokenRequest;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

@Configuration
public class ApiConfig {

    /**
     * Настройка ObjectMapper для правильной сериализации JsonNullable
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Добавляем модуль для JsonNullable
        JsonNullableModule module = new JsonNullableModule();
        mapper.registerModule(module);

        // Добавляем поддержку Java 8 Date/Time
        mapper.registerModule(new JavaTimeModule());

        // Отключаем запись временных меток
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }

    /**
     * Настройка конвертера сообщений для RestTemplate
     */
    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter(ObjectMapper objectMapper) {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);
        converter.setSupportedMediaTypes(Arrays.asList(
                org.springframework.http.MediaType.APPLICATION_JSON
//                org.springframework.http.MediaType.APPLICATIOиN_JSON_UTF8
        ));
        return converter;
    }


    @Bean
    public RestTemplate restTemplate(MappingJackson2HttpMessageConverter converter) {
        // Создаём пул соединений
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(100);
        connectionManager.setDefaultMaxPerRoute(20);

        // Настраиваем клиент
        HttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .build();

        // Создаём фабрику с поддержкой PATCH
        HttpComponentsClientHttpRequestFactory factory =
                new HttpComponentsClientHttpRequestFactory(httpClient);

//        factory.setCsetConnectTimeout(5000); // 5 сек
        factory.setReadTimeout(30000);   // 30 сек

        // Создаём RestTemplate
        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.getMessageConverters().removeIf(c -> c instanceof MappingJackson2HttpMessageConverter);
        restTemplate.getMessageConverters().add(converter);

        return restTemplate;
    }

    @Bean
    public ApiClient apiClient(AccessTokensApi accessTokensApi, RestTemplate restTemplate) {
        var apiClient = new ApiClient(restTemplate);
        apiClient.setBasePath("http://192.168.1.79:3001/api");
        var rq = new CreateAccessTokenRequest();
        rq.setEmailOrUsername("cowary");
        rq.setPassword("3*2iH4NUoy*67!Ty4G");
        rq.setWithHttpOnlyToken(false);
        accessTokensApi.setApiClient(apiClient);
        var rs = accessTokensApi.createAccessToken(rq);
        if (rs == null || StringUtils.isBlank(rs.getItem())) {
            throw new RuntimeException("Unable to authenticate");
        }
        apiClient.setBearerToken(rs.getItem());
        return apiClient;
    }

    @Bean
    public ProjectsApi projectsApi(ApiClient apiClient) {
        return new ProjectsApi(apiClient);
    }

    @Bean
    public BoardsApi boardsApi(ApiClient apiClient) {
        return new BoardsApi(apiClient);
    }

    @Bean
    public AccessTokensApi accessTokensApi() {
        return new AccessTokensApi();
    }

    @Bean
    public CardsApi cardsApi(ApiClient apiClient) {
        return new CardsApi(apiClient);
    }

    @Bean
    public CustomFieldsApi customFieldsApi(ApiClient apiClient) {
        return new CustomFieldsApi(apiClient);
    }

    @Bean
    public CustomFieldGroupsApi customFieldGroupApi(ApiClient apiClient) {
        return new CustomFieldGroupsApi(apiClient);
    }

}
