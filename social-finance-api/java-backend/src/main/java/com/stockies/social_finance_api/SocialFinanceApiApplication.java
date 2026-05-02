package com.stockies.social_finance_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SocialFinanceApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SocialFinanceApiApplication.class, args);
	}

}
