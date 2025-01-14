extern crate reqwest;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let res = reqwest::Client::new()
        .get("https://localhost:28139/")
        .basic_auth("some_username", Some("some_password"))
        .send()?
        .text()?;
    println!("{}", res);

    Ok(())
}
