use axum::{
    extract::{Json, Path},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct MessageResponse<T: Serialize> {
    message: T,
}

#[derive(Deserialize)]
struct AreaRequest {
    width: f64,
    height: f64,
}

async fn root() -> impl IntoResponse {
    Json(MessageResponse {
        message: "Hello Rust",
    })
}

async fn reverse_word(Path(word): Path<String>) -> impl IntoResponse {
    let reversed: String = word.chars().rev().collect();
    Json(MessageResponse { message: reversed })
}

async fn area(Json(body): Json<AreaRequest>) -> impl IntoResponse {
    Json(MessageResponse {
        message: body.width * body.height,
    })
}

async fn fallback() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Json(MessageResponse {
            message: "Route not found",
        }),
    )
}

pub fn create_app() -> Router {
    Router::new()
        .route("/", get(root))
        .route("/reverse/:word", get(reverse_word))
        .route("/area", post(area))
        .fallback(fallback)
}

#[tokio::main]
async fn main() {
    let app = create_app();
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8082").await.unwrap();
    println!("🦀 Rust API listening on http://0.0.0.0:8082");
    axum::serve(listener, app).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{header, Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_get_root() {
        let app = create_app();
        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["message"], "Hello Rust");
    }

    #[tokio::test]
    async fn test_reverse_word() {
        let app = create_app();
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/reverse/rustacean")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["message"], "naecatsur");
    }

    #[tokio::test]
    async fn test_post_area_valid() {
        let app = create_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/area")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"width": 4.0, "height": 5.0}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["message"], 20.0);
    }

    #[tokio::test]
    async fn test_post_area_invalid() {
        let app = create_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/area")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"width": "invalid", "height": 5.0}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn test_unknown_route() {
        let app = create_app();
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/unknown")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["message"], "Route not found");
    }
}
