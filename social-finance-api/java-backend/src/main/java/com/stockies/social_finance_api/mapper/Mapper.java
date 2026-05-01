package com.stockies.social_finance_api.mapper;

public interface Mapper <X, Y>{

    X toDto(Y y);

    Y toEntity(X x);
}
