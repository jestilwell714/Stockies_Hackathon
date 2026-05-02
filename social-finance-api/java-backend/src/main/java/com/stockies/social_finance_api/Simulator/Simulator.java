package com.stockies.social_finance_api.Simulator;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Random;

public class Simulator {

    private static final String API_URL = "http://localhost:8080/api/";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static Gson gson = new Gson();

    public static void main() throws Exception {
        List<Long> userIds = fetchUserIds();


    }

    private static void transactionLoop(List<Long> userIds, List<TransactionDto> transactions) throws IOException, InterruptedException {
        Random r = new Random();
        int n = userIds.size();
        int i = 0;
        while(true) {
            Long id = r.nextLong(n);
            TransactionDto template = transactions.get(i);
            TransactionDto transaction = new TransactionDto(
                    id,
                    template.description(),
                    template.amount(),
                    template.category()
            );
            postTransaction(transaction);
            ++i;
        }
    }

    private static void postTransaction(TransactionDto transactionDto) throws IOException, InterruptedException {
        String jsonBody = gson.toJson(transactionDto);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL + "transactions"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        client.send(request, HttpResponse.BodyHandlers.ofString());
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


        Type listType = new TypeToken<List<Long>>(){}.getType();

        return gson.fromJson(response.body(), listType);
    }

}
