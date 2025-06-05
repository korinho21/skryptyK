#!/bin/bash

# Inicjalizacja planszy
#board=(" " " " " " " " " " " " " " " " " ")
#current="player"
#plansza
draw_board() {
echo " ${board[0]} | ${board[1]} | ${board[2]} "
echo "-----------"
echo " ${board[3]} | ${board[4]} | ${board[5]} "
echo "-----------"
echo " ${board[6]} | ${board[7]} | ${board[8]} "
}

# Sprawdzenie wygranej
check_win() {
local win_combinations=(
0 1 2 3 4 5 6 7 8 # Poziomo
0 3 6 1 4 7 2 5 8 # Pionowo
0 4 8 2 4 6 # Skosy
 )

for ((i=0; i<${#win_combinations[@]}; i+=3)); do
if [[ "${board[${win_combinations[$i]}]}" != " " ]] &&
[[ "${board[${win_combinations[$i]}]}" == "${board[${win_combinations[$i+1]}]}" ]] &&
[[ "${board[${win_combinations[$i+1]}]}" == "${board[${win_combinations[$i+2]}]}" ]]; then
echo "Gracz ${board[${win_combinations[$i]}]} wygral!"
return 0
fi
done
return 1
}

# Gra przeciwko komputerowi 
computer_move() {
while true; do
move=$((RANDOM % 9))
if [[ "${board[$move]}" == " " ]]; then
board[$move]=$computer
break
fi
done
}

# Zapis i wczytanie gry
save_game() {
 printf "%s;" "$player" "$computer" "$current" "${board[@]}" > savefile.txt
}

load_game() {
 if [[ -f savefile.txt ]]; then
 IFS=';' read -ra arr < savefile.txt
 player="${arr[0]}"
 computer="${arr[1]}"
 current="${arr[2]}"
 board=("${arr[@]:3}")
 fi
}

while true; do
 #czy wczytać zapis gry
 echo "Czy chcesz wczytać zapisaną grę? (t/n)"
read odp
if [[ "${odp,,}" == "t" ]]; then
 load_game
 else
 board=(" " " " " " " " " " " " " " " " " ")
 current="player"
 echo "Wybierz swoj znak (X/O):"
 read player
 player=${player^^}
 if [[ "$player" == "X" ]]; then
 computer="O"
 else
 computer="X"
 fi
 #save_game
 fi


# Rozgrywka
while true; do
 draw_board
 if [[ "$current" == "player" ]]; then
 echo -e "Pola 0 1 2 \n     3 4 5 \n     6 7 8"
 echo "Twoj ruch (0-8):"
 read move

 if ! [[ "$move" =~ ^[0-8]$ ]]; then
echo "Niepoprawny ruch! Sprobuj ponownie."
 continue
 fi

 if [[ "${board[$move]}" != " " ]]; then
 echo "To pole jest już zajęte! Sprobuj ponownie."
 continue
 fi

 board[$move]=$player
 if check_win; then
 draw_board
 break
 fi
 current="computer"
 else
 computer_move
 if check_win; then
 draw_board
break
 fi
 current="player"
 fi

 save_game
done

echo "Czy chcesz zagrać ponownie? (t/n)"
read ponownie
if [[ "${ponownie,,}" != "t" ]]; then
break
fi
done