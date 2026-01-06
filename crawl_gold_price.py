import requests
import csv
import pathlib
from datetime import datetime, timezone, timedelta

def fetch_gold_price():
    try:
        URL = 'https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00'
        response = requests.get(URL)
        data = response.json().get('data')
        return data
    except requests.RequestException as e:
        print(f"Lỗi khi lấy dữ liệu: {e}")
        return None

def save_to_csv(data):
    if data is None:
        print("Không có dữ liệu để ghi vào CSV.")
        return

    bk_tz = timezone(timedelta(hours=7))
    date = datetime.now(bk_tz).strftime('%d-%m-%Y')

    file_path = pathlib.Path('./data/gold_price.csv')
    if not file_path.parent.exists():
        file_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = ['ngay'] + list(data[0].keys())
    file_exists = file_path.exists() and file_path.stat().st_size > 0
    with open(file_path, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()

        for item in data:
            row = {'ngay': date, **item}
            writer.writerow(row)

    print(f"Đã ghi {len(data)} dòng vào {file_path}")

def main():
    data = fetch_gold_price()
    save_to_csv(data)

if __name__ == "__main__":
    main()