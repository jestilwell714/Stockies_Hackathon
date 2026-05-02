package com.stockies.social_finance_api.Simulator;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.stockies.social_finance_api.entity.Transaction;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

public class Simulator {

    private static final String API_URL = "http://localhost:8080/api/";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static Gson gson = new Gson();

    public static void main(String[] args) throws Exception {
        List<Long> userIds = fetchUserIds();
        List<TransactionDto> transactionDtos = readCsv("src/main/java/com/stockies/social_finance_api/Simulator/simulation_data.txt");
        transactionLoop(userIds, transactionDtos);
    }

    private static List<TransactionDto> readCsv(String filePath) throws IOException {
        return Files.lines(Paths.get(filePath))
                .skip(1)
                .map(line -> line.split(","))
                .filter(parts -> parts.length >= 4)
                .map(parts -> new TransactionDto(
                        null,
                        parts[1].trim(),
                        Double.parseDouble(parts[2].trim()),
                        parts[0].trim()
                ))
                .toList();
    }

    private static void transactionLoop(List<Long> userIds, List<TransactionDto> transactions) throws IOException, InterruptedException {
        Random r = new Random();
        int n = userIds.size();
        for(int i = 0; i < transactions.size(); ++i) {
            int index = r.nextInt(userIds.size());
            Long id = userIds.get(index);
            TransactionDto template = transactions.get(i);
            TransactionDto transaction = new TransactionDto(
                    id,
                    template.description(),
                    template.amount(),
                    template.timestamp()
            );
            postTransaction(transaction);

            System.out.println("Simulating transaction for: " + template.timestamp());

            Thread.sleep(250);
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
