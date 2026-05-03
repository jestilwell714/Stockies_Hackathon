package com.stockies.social_finance_api.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class StartupDiagnostics {

    @Bean
    ApplicationRunner logStartupDiagnostics(Environment environment) {
        return args -> {
            String datasourceUrl = environment.getProperty("spring.datasource.url", "<missing>");
            String username = environment.getProperty("spring.datasource.username", "<missing>");
            String driver = environment.getProperty("spring.datasource.driver-class-name", "<missing>");
            String serverAddress = environment.getProperty("server.address", "default");
            String serverPort = environment.getProperty("server.port", "8080");
            String classifierUrl = environment.getProperty("classifier.url", "<missing>");

            System.out.println("========================================");
            System.out.println("Stockies backend diagnostics");
            System.out.println("Datasource URL: " + datasourceUrl);
            System.out.println("Datasource username: " + username);
            System.out.println("Datasource driver: " + driver);
            System.out.println("Server address: " + serverAddress);
            System.out.println("Server port: " + serverPort);
            System.out.println("Classifier URL: " + classifierUrl);
            System.out.println("========================================");
        };
    }
}
