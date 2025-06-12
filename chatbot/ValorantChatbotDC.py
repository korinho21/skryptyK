import discord
from discord.ext import commands
import requests
from bs4 import BeautifulSoup
import asyncio
from datetime import datetime
import random


def normalize_text(text):
    
    return text.replace(".", "").lower().strip()

def format_date(date_str):
   
    try:
        dt = datetime.strptime(date_str, "%B %d, %Y")
        return dt.strftime("%d %B %Y").lower()
    except Exception as e:
        return date_str.lower().strip()


# dane turniejów
def get_valorant_tournaments():
    tournaments = [
        {
            'name': 'Champions Tour 2025: Masters Toronto',
            'matches': [
                "Mecz 1: Sentinels vs Gen.G - 7 June 2025",
                "Mecz 2: Paper Rex vs BLG - 14 June 2025",
                "Mecz 3: Team Liquid vs Wolves Esport - 21 June 2025",
                "Mecz 4: Team Heretics vs MIBR - 22 June 2025"
            ],
            
            'teams': [
                {
                    'name': 'Sentinels',
                    'last5': ["Win", "Win", "Win", "Loss", "Win"],
                    'players': [
                        {'first_name': 'Mohamed Amine', 'last_name': 'Ouarid', 'nick': 'johnqt'},
                        {'first_name': 'Jordan', 'last_name': 'Montemurro', 'nick': 'Zellsis'},
                        {'first_name': 'Marshall', 'last_name': 'Massey', 'nick': 'N4RRATE'},
                        {'first_name': 'Zachary', 'last_name': 'Patrone', 'nick': 'zekken'},
                        {'first_name': 'Sean', 'last_name': 'Bezerra', 'nick': 'bang'}
                    ]
                },
                {
                    'name': 'Gen.G',
                    'last5': ["Loss", "Win", "Win", "Win", "Loss"],
                    'players': [
                        {'first_name': 'Byeon', 'last_name': 'Sang-beom', 'nick': 'Munchkin'},
                        {'first_name': 'Kim', 'last_name': 'Na-ra', 'nick': 't3xture'},
                        {'first_name': 'Jung', 'last_name': 'Jae-sung', 'nick': 'Foxy9'},
                        {'first_name': 'Seo', 'last_name': 'Jae-young', 'nick': 'Suggest'},
                        {'first_name': 'Kim', 'last_name': 'Won-tae', 'nick': 'Karon'}
                    ]
                },
                {
                    'name': 'Paper Rex',
                    'last5': ["Win", "Win", "Loss", "Draw", "Win"],
                    'players': [
                        {'first_name': 'Aaron', 'last_name': 'Leonhart', 'nick': 'mindfreak'},
                        {'first_name': 'Khalish', 'last_name': 'Rusyaidee', 'nick': 'd4v41'},
                        {'first_name': 'Wang Jing Jie', 'last_name': '', 'nick': 'Jinggg'},
                        {'first_name': 'Ilya', 'last_name': 'Petrov', 'nick': 'something'},
                        {'first_name': 'Jason', 'last_name': 'Susanto', 'nick': 'f0rsakeN'}
                    ]
                },
                {
                    'name': 'BLG',
                    'last5': ["Loss", "Loss", "Loss", "Loss", "Draw"],
                    'players': [
                        {'first_name': 'Wang', 'last_name': 'Haozhe', 'nick': 'whzy'},
                        {'first_name': 'Marcus', 'last_name': 'Tan', 'nick': 'nephh'},
                        {'first_name': 'Lu', 'last_name': 'Yinzhong', 'nick': 'Levius'},
                        {'first_name': 'Liu', 'last_name': 'Yuxiang', 'nick': 'Knight'},
                        {'first_name': 'Wang', 'last_name': 'Xiaojie', 'nick': 'rushia'}
                    ]
                },
                {
                    'name': 'Team Liquid',
                    'last5': ["Win", "Win", "Win", "Win", "Win"],
                    'players': [
                        {'first_name': 'Ayaz', 'last_name': 'Akhmetshin', 'nick': 'nAts'},
                        {'first_name': 'Kamil', 'last_name': 'Frąckowiak', 'nick': 'kamo'},
                        {'first_name': 'Patryk', 'last_name': 'Fabrowski', 'nick': 'paTiTek'},
                        {'first_name': 'Maikls', 'last_name': 'Zdanovs', 'nick': 'Serial'},
                        {'first_name': 'Georgio', 'last_name': 'Sanassy', 'nick': 'keiko'}
                    ]
                },
                {
                    'name': 'Wolves Esport',
                    'last5': ["Win", "Loss", "Win", "Loss", "Win"],
                    'players': [
                        {'first_name': 'Pong', 'last_name': 'Gaa Hei', 'nick': 'SiuFatBB'},
                        {'first_name': 'Liang', 'last_name': 'Youhao', 'nick': 'Lysoar'},
                        {'first_name': 'Huang', 'last_name': 'Yung-chieh', 'nick': 'Yuicaw'},
                        {'first_name': 'Tyler James', 'last_name': 'Aeria', 'nick': 'Juicy'},
                        {'first_name': 'Liu', 'last_name': 'Jiunting', 'nick': 'Spring'}
                    ]
                }
            ]
        },
        {
            'name': 'Game changers 2025 North America: Stage 1',
            'matches': [
                "Mecz 1: Shopify Rebellion Gold vs Wadadaa - 4 March 2025",
                "Mecz 2: Ghost Gaming vs Aussie and Friends - 2 June 2025"
            ],
            
            'teams': [
                {
                    'name': 'Shopify Rebellion Gold',
                    'last5': ["Win", "Win", "Win", "Loss", "Win"],
                    'players': [
                        {'first_name': 'Melanie', 'last_name': 'Capone', 'nick': 'meL'},
                        {'first_name': 'Nicole', 'last_name': 'Tierce', 'nick': 'Noia'},
                        {'first_name': 'Karnthida', 'last_name': 'Chaisrakeo', 'nick': 'dodonut'},
                        {'first_name': 'Sarah', 'last_name': 'Simpson', 'nick': 'sarahcat'},
                        {'first_name': 'Alexis', 'last_name': 'Guarrasi', 'nick': 'Alexis'}
                    ]
                },
                {
                    'name': 'Wadadaa',
                    'last5': ["Loss", "Win", "Win", "Win", "Loss"],
                    'players': [
                        {'first_name': 'SleepyAria', 'last_name': '', 'nick': 'SleepyAria'},
                        {'first_name': 'Australis', 'last_name': '', 'nick': 'Australis'},
                        {'first_name': 'joona', 'last_name': '', 'nick': 'joona'},
                        {'first_name': 'StarBound', 'last_name': '', 'nick': 'StarBound'},
                        {'first_name': 'PowerPixele', 'last_name': '', 'nick': 'PowerPixele'}
                    ]
                },
                {
                    'name': 'Ghost Gaming',
                    'last5': ["Win", "Loss", "Win", "Draw", "Win"],
                    'players': [
                        {'first_name': 'miyara', 'last_name': '', 'nick': 'miyara'},
                        {'first_name': 'vanitas', 'last_name': '', 'nick': 'vanitas'},
                        {'first_name': 'ariel', 'last_name': '', 'nick': 'ariel'},
                        {'first_name': 'ketarys', 'last_name': '', 'nick': 'ketarys'},
                        {'first_name': 'bunnybee', 'last_name': '', 'nick': 'bunnybee'}
                    ]
                },
                {
                    'name': 'Aussie and Friends',
                    'last5': ["Loss", "Loss", "Win", "Win", "Loss"],
                    'players': [
                        {'first_name': 'Presley', 'last_name': 'Anderson', 'nick': 'Slandy'},
                        {'first_name': 'riv', 'last_name': '', 'nick': 'riv'},
                        {'first_name': 'Lydia', 'last_name': 'Wilson', 'nick': 'lidyuh'},
                        {'first_name': 'Jina', 'last_name': 'Kim', 'nick': 'marceline'},
                        {'first_name': 'Jasmine', 'last_name': 'Manankil', 'nick': 'Jazzyk1ns'}
                    ]
                }
            ]
        },
        {
            'name': 'Game changers 2025 LATAM North: Stage 2',
            'matches': [
                "Mecz 1: KTANA GC vs TeamReis ROSE - 7 May 2025",
                "Mecz 2: 1UP festiwal esports vs NTH - 31 May 2025"
            ],
            
            'teams': [
                {
                    'name': 'KTANA GC',
                    'last5': ["Win", "Win", "Win", "Loss", "Win"],
                    'players': [
                        {'first_name': 'Tura', 'last_name': '', 'nick': 'Tura'},
                        {'first_name': 'ZIDIAN', 'last_name': '', 'nick': 'ZIDIAN'},
                        {'first_name': 'Lynxz', 'last_name': '', 'nick': 'Lynxz'},
                        {'first_name': 'Shyrexx', 'last_name': '', 'nick': 'Shyrexx'},
                        {'first_name': 'Riss', 'last_name': '', 'nick': 'Riss'}
                    ]
                },
                {
                    'name': 'TeamReis ROSE',
                    'last5': ["Loss", "Win", "Loss", "Win", "Loss"],
                    'players': [
                        {'first_name': 'Akemi', 'last_name': '', 'nick': 'Akemi'},
                        {'first_name': 'Mochi', 'last_name': '', 'nick': 'Mochi'},
                        {'first_name': 'Sakura', 'last_name': '', 'nick': 'Sakura'},
                        {'first_name': '9ouls', 'last_name': '', 'nick': '9ouls'},
                        {'first_name': 'Lian', 'last_name': '', 'nick': 'Lian'}
                    ]
                },
                {
                    'name': '1UP festiwal esports',
                    'last5': ["Win", "Draw", "Win", "Win", "Win"],
                    'players': [
                        {'first_name': 'Fire', 'last_name': '', 'nick': 'Fire'},
                        {'first_name': 'Karen', 'last_name': '', 'nick': 'Karen'},
                        {'first_name': 'Zaki', 'last_name': '', 'nick': 'Zaki'},
                        {'first_name': 'GuterWoman', 'last_name': '', 'nick': 'GuterWoman'},
                        {'first_name': 'CarmenG7', 'last_name': '', 'nick': 'CarmenG7'}
                    ]
                },
                {
                    'name': 'NTH',
                    'last5': ["Loss", "Loss", "Loss", "Win", "Loss"],
                    'players': [
                        {'first_name': 'wanheda', 'last_name': '', 'nick': 'wanheda'},
                        {'first_name': 'Jia', 'last_name': '', 'nick': 'Jia'},
                        {'first_name': 'Temai', 'last_name': '', 'nick': 'Temai'},
                        {'first_name': 'Tura', 'last_name': '', 'nick': 'Tura'},
                        {'first_name': 'Kyujinn', 'last_name': '', 'nick': 'Kyujinn'}
                    ]
                }
            ]
        }
    ]
    
    #losowe statystyki
    for tournament in tournaments:

        
        
        for team in tournament.get('teams', []):
            for p in team.get('players', []):
                p['kills'] = random.randint(0, 60)
                p['deaths'] = random.randint(0, 60)
                p['assists'] = random.randint(0, 60)
    
    return tournaments



#zmienne globalne
user_selection = {}
quick_preview_players = {}
quick_preview_teams = {}


TOKEN = "MTM4MTY0NTIxODEyNTg0NDYxMw.GQsqSG.I1Gqytls3xGu3JpgkoAhzvU4E6AnaLIYVX9Boc"

intents = discord.Intents.default()
intents.message_content = True  

bot = commands.Bot(command_prefix="--", intents=intents)


@bot.command()
async def turnieje(ctx):
    tournaments = get_valorant_tournaments()
    if not tournaments:
        await ctx.send("Brak dostępnych turniejów.")
        return

    # dostepne turnieje
    tour_list = "\n".join([t['name'] for t in tournaments])
    await ctx.send("Dostępne turnieje Valorant:\n" + tour_list + "\n\nPodaj nazwę turnieju, który Cię interesuje:")

    def check(m):
        return m.author == ctx.author and m.channel == ctx.channel

    try:
        response = await bot.wait_for('message', check=check, timeout=60)
        tournament_name = response.content.strip()
    except asyncio.TimeoutError:
        await ctx.send("Przekroczono czas odpowiedzi.")
        return

    selected_tournament = None
    for t in tournaments:
        if t['name'].lower() == tournament_name.lower():
            selected_tournament = t
            break

    if not selected_tournament:
        await ctx.send("Nie znaleziono turnieju o podanej nazwie.")
        return

    # Zapis wyboru turnieju
    user_selection[ctx.author.id] = selected_tournament

    
    await ctx.send("Co chcesz zobaczyć? Wpisz jedną z opcji:\n`zawodnicy`, `drużyny`, `terminarz`")
    try:
        response = await bot.wait_for('message', check=check, timeout=60)
        option = response.content.strip().lower()
    except asyncio.TimeoutError:
        await ctx.send("Przekroczono czas odpowiedzi.")
        return

    await process_option(ctx, option, selected_tournament)

# dlugie wiadomosci
async def send_long_message(ctx, msg, chunk_size=2000):
   
    if len(msg) <= chunk_size:
        await ctx.send(msg)
    else:
        for i in range(0, len(msg), chunk_size):
            await ctx.send(msg[i:i+chunk_size])
            
async def process_option(ctx, option, tournament):
    if option == "zawodnicy":
        teams = tournament.get('teams', [])
        if not teams:
            await ctx.send("Brak drużyn lub zawodników w tym turnieju.")
        else:
            msg = "**Zawodnicy według drużyn:**\n"
            for team in teams:
                msg += f"\n**{team['name']}**\n"
                for p in team.get('players', []):
                    msg += (f"- {p['first_name']} {p['last_name']} ({p['nick']}) - "
                            f"Kills: {p.get('kills', '?')}, Deaths: {p.get('deaths', '?')}, Assists: {p.get('assists', '?')}\n")
            msg += "\nAby dodać zawodnika do szybkiego podglądu, wpisz `--add_player:[nazwa_gracza]`"
            await send_long_message(ctx, msg)
    elif option == "drużyny":
        teams = tournament.get('teams', [])
        if not teams:
            await ctx.send("Brak drużyn.")
        else:
            msg = "**Drużyny:**\n"
            for i, team in enumerate(teams, start=1):
                results = ", ".join(team.get('last5', []))
                msg += f"{i}. {team['name']} - Ostatnie 5 gier: {results}\n"
            msg += "\nAby dodać drużynę do szybkiego podglądu, wpisz `--add_team:[nazwa_drużyny]`"
            await ctx.send(msg)
    elif option == "terminarz":
        schedule = tournament.get('matches', [])
        if not schedule:
            await ctx.send("Brak terminarza.")
        else:
            msg = f"**Terminarz turnieju {tournament['name']}**\n"
            for match in schedule:
                if isinstance(match, dict) and 'match' in match and 'datetime' in match:
                    msg += f"- {match['match']} - {match['datetime']}\n"
                else:
                    msg += f"- {match}\n"
               
                await send_long_message(ctx, msg)


            
    else:
        await ctx.send("Niepoprawna opcja.")

@bot.event
async def on_message(message):
    if message.author.bot:
        return

    content = message.content.strip().lower()

    
    if content in ["zawodnicy", "drużyny", "terminarz"] and message.author.id in user_selection:
        tournament = user_selection[message.author.id]
        ctx = await bot.get_context(message)
        await process_option(ctx, content, tournament)
        return

    # Dodawanie zawodnika do szybkiego podglądu
    if message.content.startswith("--add_player:"):
        player_name = message.content[len("--add_player:"):].strip()
        if player_name.startswith("[") and player_name.endswith("]"):
            player_name = player_name[1:-1].strip()

        selected = user_selection.get(message.author.id)
        if not selected:
            await message.channel.send("Najpierw wybierz turniej poleceniem `--turnieje`.")
        else:
            quick_preview_players.setdefault(message.author.id, [])
            norm_input = normalize_text(player_name)
            found_player = None

            for team in selected.get('teams', []):
                for p in team.get('players', []):
                    candidate_nick = normalize_text(p['nick'])
                    candidate_full = normalize_text(p['first_name'] + " " + p['last_name'])
                   # norm_input = normalize_text(player_name)
                    if candidate_nick == norm_input or candidate_full == norm_input:
                        found_player = p
                        break
                if found_player:
                    break
                    
            if found_player:
                already_added = any(
                    normalize_text(x['nick']) == normalize_text(found_player['nick'])
                    for x in quick_preview_players[message.author.id]
                )
                if already_added:
                    await message.channel.send(
                        f"Zawodnik {found_player['first_name']} {found_player['last_name']} ({found_player['nick']}) jest już dodany do szybkiego podglądu turnieju **{selected['name']}**."
                    )
                else:
                    quick_preview_players[message.author.id].append(found_player)
                    await message.channel.send(
                        f"Zawodnik {found_player['first_name']} {found_player['last_name']} ({found_player['nick']}) został dodany do szybkiego podglądu turnieju **{selected['name']}**."
                    )
            else:
                await message.channel.send("Nie znaleziono zawodnika o podanej nazwie.")
        return

    # Dodawanie drużyny do szybkiego podglądu
    if message.content.startswith("--add_team:"):
        team_name = message.content[len("--add_team:"):].strip()
        if team_name.startswith("[") and team_name.endswith("]"):
            team_name = team_name[1:-1].strip()
        selected = user_selection.get(message.author.id)
        if not selected:
            await message.channel.send("Najpierw wybierz turniej poleceniem `--turnieje`.")
        else:
            quick_preview_teams.setdefault(message.author.id, [])
            teams_list = selected.get('teams', [])
            found_team = None
            for t in teams_list:
                if normalize_text(t['name']) == normalize_text(team_name):
                    found_team = t
                    break
            if found_team:
                already_added = any(
                    normalize_text(x['name']) == normalize_text(found_team['name'])
                    for x in quick_preview_teams[message.author.id]
                )
                if already_added:
                    await message.channel.send(
                        f"Drużyna {found_team['name']} jest już dodana do szybkiego podglądu turnieju **{selected['name']}**."
                    )
                else:
                    quick_preview_teams[message.author.id].append(found_team)
                    await message.channel.send(
                        f"Drużyna {found_team['name']} została dodana do szybkiego podglądu turnieju **{selected['name']}**."
                    )
            else:
                await message.channel.send("Nie znaleziono drużyny o podanej nazwie.")
        return

    # szybki podglad
    if message.content.startswith("--podglad") or message.content.startswith("--podgląd"):
        uid = message.author.id
        selected = user_selection.get(uid)
        if not selected:
            await message.channel.send("Najpierw wybierz turniej poleceniem `--turnieje`.")
        else:
            tp = quick_preview_players.get(uid, [])
            tt = quick_preview_teams.get(uid, [])
            msg = f"**Szybki podgląd turnieju {selected['name']}**\n"
            if tt:
                msg += "\n**Drużyny:**\n"
                for team in tt:
                    results = ", ".join(team.get('last5', []))
                    msg += f"- {team['name']} : ostatnie 5 gier: {results}\n"
            if tp:
                msg += "\n**Zawodnicy:**\n"
                for player in tp:
                    msg += (f"- {player['first_name']} {player['last_name']} ({player['nick']}) : "
                            f"Kills: {player['kills']}, Deaths: {player['deaths']}, Assists: {player['assists']}\n")
            if not tp and not tt:
                msg += "Brak dodanych drużyn ani zawodników."
            await message.channel.send(msg)
        return

    
    if message.content.startswith("--showAll"):
        tournaments = get_valorant_tournaments()
        if not tournaments:
            await message.channel.send("Brak turniejów.")
        else:
            msg = "**Wszystkie turnieje Valorant:**\n"
            for tour in tournaments:
                msg += f"\n**Turniej: {tour['name']}**\n"
                msg += "**Drużyny:**\n"
                for t in tour.get('teams', []):
                    results = ", ".join(t.get('last5', []))
                    msg += f"- {t['name']} : Ostatnie 5 gier: {results}\n"
                msg += "**Rozgrywki:**\n"
                for m in tour.get('matches', []):
                    msg += f"- {m}\n"
                players = tour.get('players', [])
                if players:
                    sorted_players = sorted(players, key=lambda p: p['nick'])
                    msg += "**Zawodnicy:**\n"
                    for p in sorted_players:
                        msg += (f"- {p['first_name']} {p['last_name']} ({p['nick']}) : "
                                f"Kills: {p['kills']}, Deaths: {p['deaths']}, Assists: {p['assists']}\n")
                else:
                    msg += "Brak zawodników.\n"
            await message.channel.send(msg)
        return

    await bot.process_commands(message)

@bot.command()
async def rozgrywki(ctx):
    tournaments = get_valorant_tournaments()
    await ctx.send("**Dostępne turnieje Valorant:**\n" + "\n".join([t['name'] for t in tournaments]))


bot.run(TOKEN)