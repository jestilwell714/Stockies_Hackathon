package com.stockies.social_finance_api;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.entity.User;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

public class Simulator {

    private static final String API_URL = "http://localhost:8080/api/";
    private static final HttpClient client = HttpClient.newHttpClient();

    public static void main() {


    }

    private static List<Long> fetchUserIds() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL + "users/ids"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed: " + response.statusCode());
        }

        Gson gson = new Gson();
        Type listType = new TypeToken<List<Long>>(){}.getType();

        return gson.fromJson(response.body(), listType);
    }

}
