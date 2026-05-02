package com.stockies.social_finance_api.Simulator;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder; // Added for pretty printing if you want it
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Random;
import java.util.UUID;

public class Simulator {

    private static final String API_URL = "http://172.20.10.10:8080/api/";
    private static final HttpClient client = HttpClient.newHttpClient();

    // Using setPrettyPrinting() makes the console output much easier to read for demos
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    // Inner class to map the user response
    private static class User {
        UUID userId;
    }

    // Record matching your JSON requirements
    public record TransactionDto(UUID userId, String description, double amount, String timestamp, String category) {}

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
                .skip(1)
                .map(line -> line.split(","))
                .filter(parts -> parts.length >= 4)
                .map(parts -> new TransactionDto(
                        null,
                        parts[1].trim(),
                        Double.parseDouble(parts[2].trim()),
                        parts[0].trim(),
                        parts[3].trim()
                ))
                .toList();
    }

    private static void transactionLoop(List<UUID> userIds, List<TransactionDto> transactions) throws IOException, InterruptedException {
        Random r = new Random();
        for (int i = 0; i < transactions.size(); ++i) {
            UUID id = userIds.get(r.nextInt(userIds.size()));
            TransactionDto template = transactions.get(i);

            TransactionDto transaction = new TransactionDto(
                    id,
                    template.description(),
                    template.amount(),
                    template.timestamp(),
                    template.category()
            );
            postTransaction(transaction);

            Thread.sleep(250);
        }
    }

    private static void postTransaction(TransactionDto transactionDto) throws IOException, InterruptedException {
        String jsonBody = gson.toJson(transactionDto);

        // Print the JSON before sending
        System.out.println("------------------------------------");
        System.out.println("SENDING JSON TO BACKEND:");
        System.out.println(jsonBody);
        System.out.println("------------------------------------");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL + "transactions"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Server Response Code: " + response.statusCode());
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

        Type listType = new TypeToken<List<User>>(){}.getType();
        List<User> users = gson.fromJson(response.body(), listType);

        return users.stream()
                .map(user -> user.userId)
                .toList();
    }
}