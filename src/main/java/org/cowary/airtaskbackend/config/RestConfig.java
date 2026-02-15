package org.cowary.airtaskbackend.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.swagger.v3.core.util.ObjectMapperFactory;
import org.apache.commons.lang3.StringUtils;
import org.cowary.airtaskbackend.api.planko.*;
import org.cowary.airtaskbackend.invoker.planko.ApiClient;
import org.cowary.airtaskbackend.model.planko.CreateAccessTokenRequest;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;

@Configuration
public class RestConfig {

    private final ObjectMapperFactory objectMapperFactory;

    public RestConfig(ObjectMapperFactory objectMapperFactory) {
        this.objectMapperFactory = objectMapperFactory;
    }

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .setSerializationInclusion(JsonInclude.Include.NON_NULL)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
    }

    @Bean
    public JsonMapper jsonMapper() {
        JsonMapper mapper = JsonMapper.builder()
                .addModules(new tools.jackson.databind.module.SimpleModule()
                        .addDeserializer(LocalDateTime.class, new CustomLocalDateTimeDeserializer()))
                .build();
        return mapper;
    }

    @Bean
    public ObjectMapper externalObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JsonNullableModule());
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        SimpleModule module = new SimpleModule();
        mapper.registerModule(javaTimeModule);
        mapper.registerModule(module);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    /**
     * RestTemplate для внешних вызовов с кастомным ObjectMapper
     */
    @Bean
    public RestTemplate externalRestTemplate(ObjectMapper externalObjectMapper) {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(externalObjectMapper);

        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getMessageConverters().add(0, converter); // Добавляем первым
        return restTemplate;
    }

    //TODO: https://spring.io/blog/2025/10/07/introducing-jackson-3-support-in-spring

    /**
     * Настройка конвертера сообщений для RestTemplate
     */
//    @Bean
//    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter(ObjectMapper objectMapper) {
//        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
//        converter.setObjectMapper(objectMapper);
//        converter.setSupportedMediaTypes(Arrays.asList(
//                org.springframework.http.MediaType.APPLICATION_JSON
////                org.springframework.http.MediaType.APPLICATIOиN_JSON_UTF8
//        ));
//        return converter;
//    }
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
