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
import java.util.UUID;

public class Simulator {

    private static final String API_URL = "http://172.20.10.10:8080/api/";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static Gson gson = new Gson();

    public static void main(String[] args) throws Exception {
        List<UUID> userIds = fetchUserIds();

        if (userIds.isEmpty()) {
            System.err.println("No users found! Is the database seeded?");
            return;
        }

        System.out.println("Fetched " + userIds.size() + " participants. Starting simulation...");

        List<TransactionDto> transactionDtos = readCsv("src/main/java/com/stockies/social_finance_api/Simulator/simulation_data.txt");
        transactionLoop(userIds, transactionDtos);
    }

    private static List<TransactionDto> readCsv(String filePath) throws IOException {
        return Files.lines(Paths.get(filePath))
                .skip(1) // Skip the header row
                .map(line -> line.split(","))
                .filter(parts -> parts.length >= 3) // Ensure we have enough columns
                .filter(parts -> !parts[2].trim().equalsIgnoreCase("amount")) // EXTRA SAFETY: Skip if it's the header
                .map(parts -> {
                    try {
                        return new TransactionDto(
                                null,
                                parts[1].trim(),
                                Double.parseDouble(parts[2].trim()),
                                parts[0].trim()
                        );
                    } catch (NumberFormatException e) {
                        System.err.println("Skipping malformed line: " + String.join(",", parts));
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull) // Remove any nulls from failed parses
                .toList();
    }

    private static void transactionLoop(List<UUID> userIds, List<TransactionDto> transactions) throws IOException, InterruptedException {
        Random r = new Random();
        int n = userIds.size();
        for(int i = 0; i < transactions.size(); ++i) {
            int index = r.nextInt(userIds.size());

            UUID id = userIds.get(index);
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

    private static List<UUID> fetchUserIds() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL + "demo/participants"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to fetch participants: " + response.statusCode());
        }

        // Parse the JSON array into our List of User objects
        Type listType = new TypeToken<List<User>>(){}.getType();
        List<User> users = gson.fromJson(response.body(), listType);

        // Extract the UUIDs from the objects
        return users.stream()
                .map(user -> user.id)
                .toList();
    }

}


