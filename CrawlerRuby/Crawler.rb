require 'nokogiri'
require 'httparty'
require 'sqlite3'

puts "Rozpoczynam zbieranie ofert domów z Allegro Lokalnie."


puts "Podaj słowa kluczowe do wyszukiwania (oddzielone przecinkiem ',' ):"
keywords_input = gets.chomp
KEYWORDS = keywords_input.split(",").map(&:strip).map(&:downcase)

puts "Podaj liczbę stron do przeszukania (1-431):"
pages_input = gets.chomp
PAGES = pages_input.to_i

puts "🔎 Szukam ofert z frazami kluczowymi: #{KEYWORDS.join(', ')}"
puts "🔎 Przeszukuje #{PAGES} stron..."

#tworzenie bazy danych SQLite
db = SQLite3::Database.new "nieruchomosci.db"

db.execute <<-SQL
  CREATE TABLE IF NOT EXISTS oferty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tytul TEXT,
    cena TEXT,
    lokalizacja TEXT,
    metraz TEXT,
    rok_budowy TEXT,
    opis TEXT,
    link TEXT
  );
SQL

#pobieranie stron z ofertami
(1..PAGES).each do |page|
  url = "https://allegrolokalnie.pl/oferty/nieruchomosci/domy-na-sprzedaz-112740?page=#{page}"
  
  headers = {
    "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  }
  response = HTTParty.get(url, headers: headers)

  next if response.body.nil? || response.body.empty?

  parsed_page = Nokogiri::HTML(response.body)

 #pobieranie linków do ofert
  offer_links = parsed_page.css('a[href*="/oferta/"]').map { |link| link['href'] }.uniq

  puts "🔎 Strona #{page}: Znaleziono #{offer_links.size} ofert!"

  #szczegóły ofert
  offer_links.each do |link|
    begin
      full_url = link.start_with?("http") ? link : "https://allegrolokalnie.pl#{link}"
      product_page = HTTParty.get(full_url, headers: headers)

      next if product_page.body.nil? || product_page.body.empty?

      parsed_offer = Nokogiri::HTML(product_page.body)

      #pobieranie tytułu oferty
      title = parsed_offer.at_css('h1.ml-heading-large')&.text&.strip

      next if title.nil? || title.empty?

     #filtrowanie ofert po słowach kluczowych
      matches_keyword = KEYWORDS.any? { |keyword| title.downcase.include?(keyword) }
      next unless matches_keyword

      price = parsed_offer.css('.ml-offer-price__dollars').text.strip || "Brak danych"
      location = parsed_offer.css('address[itemprop="address"]').text.strip || "Brak danych"
      area = parsed_offer.css('td.mlc-params__parameter-value[itemprop="value"]').text.strip || "Brak danych"
      year_built = parsed_offer.at_css('td.mlc-params__parameter-value[itemprop="value"]')&.text&.strip || "Brak danych"
      description = parsed_offer.at_css('div.mlc-offer__description')&.text&.strip || "Brak opisu"

      #zapis danych do bazy
      db.execute("INSERT INTO oferty (tytul, cena, lokalizacja, metraz, rok_budowy, opis, link) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                  [title, price, location, area, year_built, description, full_url])

      puts "✅ Zapisano ofertę: #{title}"
    rescue => e
      puts "❌ Błąd pobierania oferty: #{full_url} - #{e.message}"
    end
  end
end

puts "✅ Wszystkie dane zostały zapisane do nieruchomosci.db!"
count = db.execute("SELECT COUNT(*) FROM oferty").first.first
puts "Liczba zapisanych ofert: #{count}"

db.close