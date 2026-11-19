// Danish content for the workflow nodes, keyed by node num.
// Only text fields are translated — num, kind and dept are shared with data.js.
const NODES_DA = {
  "1": {
    title: "Ordre modtaget",
    deptName: "Salgsafdelingen",
    who: "Sælger / Kundeservicekoordinator",
    tasks: [
      "Modtag kundens købsordre (e-mail, telefon eller webportal).",
      "Kontroller kundeoplysninger, varer, antal, priser og lagerstatus.",
      "Tast ordren ind i systemet, og bekræft modtagelsen over for kunden."
    ],
    outcomes: [
      { when: "Ordren er komplet og korrekt", then: "Ordren sendes videre til kredit & finans til godkendelse." },
      { when: "Manglende eller uklare oplysninger", then: "Der oprettes en kundeforespørgsel; ordren holder, indtil kunden svarer — intet bevæger sig videre ned gennem kæden i mellemtiden." }
    ]
  },
  "2": {
    title: "Kreditvurdering & godkendelse",
    deptName: "Finansafdelingen",
    who: "Debitorbogholder, godkendes af finanschefen",
    tasks: [
      "Kreditvurdér kunden mod kreditmaksimum og betalingshistorik.",
      "Bekræft betalingsbetingelserne (forudbetaling, netto 30 osv.).",
      "Godkend ordren til ekspedition — eller sæt den på kreditstop."
    ],
    outcomes: [
      { when: "Inden for kreditmaksimum", then: "Ordren frigives til lageret som plukliste." },
      { when: "Over kreditmaksimum eller dårlig betalingshistorik", then: "Ordren går videre til kreditstop-processen." }
    ]
  },
  "2a": {
    title: "Kreditstop",
    deptName: "Finansafdelingen",
    who: "Finanschefen sammen med sælgeren",
    tasks: [
      "Underret kunden og sælgeren, og registrer årsagen til stoppet i systemet.",
      "Aftal en vej videre med kunden.",
      "Frigiv kun ordren med en godkendt løsning."
    ],
    outcomes: [
      { when: "Kunden betaler depositum eller forudbetaler", then: "Ordren frigives, og plukket kan starte." },
      { when: "Ordren reduceres til at passe inden for maksimum", then: "De nye beløb tastes ind, og ordren frigives." },
      { when: "Finanschefen godkender en dispensation med begrundelse", then: "Ordren frigives og markeres til opfølgning." },
      { when: "Ingen løsning", then: "Ordren afvises eller forbliver på stop — ingen varer afsendes, mens et stop er aktivt." }
    ]
  },
  "3": {
    title: "Pluk i lageret",
    deptName: "Lagerafdelingen",
    who: "Plukker, under vejledning af lagerchefen",
    tasks: [
      "Modtag pluklisten, der genereres ud fra den godkendte ordre.",
      "Pluk varerne fra hylderne, og registrér parti- og serienumre.",
      "Eftertjek det plukkede op mod ordren."
    ],
    outcomes: [
      { when: "Alt er på lager", then: "De plukkede varer sendes videre til emballering og kvalitetskontrol." },
      { when: "Der findes mangel eller beskadigede varer", then: "Gå videre til mangel & restordre-processen." }
    ]
  },
  "3a": {
    title: "Mangel & restordre",
    deptName: "Lager + Indkøb + Salg",
    who: "Lagerchefen sammen med indkøb og sælgeren",
    tasks: [
      "Undersøg leveringsdatoer på kommende genopfyldning hos indkøbet.",
      "Undersøg, om der findes et passende alternativ til den manglende vare.",
      "Aftal løsningen med kunden, før noget ændres."
    ],
    outcomes: [
      { when: "Delvis på lager", then: "Afsend det, der er til stede; resten bliver restordre, og den nye leveringsdato bekræftes med kunden." },
      { when: "Kunden accepterer en alternativ vare", then: "Pluklisten opdateres med varen, og ordren fortsætter." },
      { when: "Kunden foretrækker at vente", then: "Ordren holder, til genopfyldningen ankommer; indkøbet prioriterer manglen." },
      { when: "Kunden annullerer de berørte linjer", then: "Annulleringen bekræftes skriftligt, og ordren fortsætter med de resterende linjer." }
    ]
  },
  "4": {
    title: "Emballering & kvalitetskontrol",
    deptName: "Produktion / Montage",
    who: "Pakkemedarbejder sammen med kvalitetskontrollanten",
    tasks: [
      "Pak varerne klar til transport, og mærk pakkerne pr. ordre.",
      "Kvalitetskontrollen gennemfører den endelige inspektion og kvitterer.",
      "Vedlæg følgeseddel og eventuelle certificeringer."
    ],
    outcomes: [
      { when: "Inspektionen er godkendt", then: "Den pakkede ordre overdrages til logistikken til afsendelse." },
      { when: "Varen fejler inspektionen eller er beskadiget", then: "Varen plukkes på ny fra lageret, og kontrollen gentages; den fejlbehæftede vare sættes i karantæne til leverandøren eller kasseres." }
    ]
  },
  "5": {
    title: "Afsendelse & leveringsbekræftelse",
    deptName: "Logistikafdelingen",
    who: "Forsendelsesmedarbejder, koordineret af logistikchefen",
    tasks: [
      "Bestil transport/bud, og udarbejd forsendelsesdokumenter (waybill, toldpapirer ved behov).",
      "Last varerne, registrér forsendelsen, og send sporingsoplysninger via salget til kunden.",
      "Bekræft leveringen, og gem leveringsbeviset (kvittering eller elektronisk bekræftelse)."
    ],
    outcomes: [
      { when: "Leveret med leveringsbevis", then: "Ordren går videre til fakturering — kun de afsendte mængder faktureres." },
      { when: "Beskadiget eller bortkommet under transport", then: "Gå videre til transportskade-processen." },
      { when: "Kunden melder et problem efter levering", then: "Gå videre til retur/RMA-processen." }
    ]
  },
  "5a": {
    title: "Transportskade",
    deptName: "Logistikafdelingen",
    who: "Logistikchefen sammen med transportøren og kvalitetskontrollen",
    tasks: [
      "Dokumentér skaden med billeder, og underret transportøren inden klagefristen udløber.",
      "Anmeld skaden hos transportøren, og hold kunden underrettet.",
      "Aftal med kunden: erstatningsvare eller kredit."
    ],
    outcomes: [
      { when: "Erstatningsvare aftales", then: "Der oprettes en erstatningslinje, som genindtræder i flowet ved pluk i lageret; de beskadigede varer returneres eller kasseres efter transportørens anvisninger." },
      { when: "Kreditering aftales", then: "Finans udsteder en kreditnota, når skadeskravet er afsluttet, og ordren fortsætter til fakturering for de uskadede linjer." }
    ]
  },
  "5b": {
    title: "Retur / RMA",
    deptName: "Salg + Lager + Finans",
    who: "Kundeservicekoordinator sammen med lageret og finans",
    tasks: [
      "Godkend returneringen (RMA-nummer) — kun godkendte returneringer modtages.",
      "Modtag og inspicér de returnerede varer ved ankomsten.",
      "Træf beslutning om varerne: tilbage på lageret, kassation eller retur til leverandøren."
    ],
    outcomes: [
      { when: "Returneringen er gyldig, varerne kan sælges igen", then: "Varerne lægges tilbage på lageret, og finans udsteder en kreditnota på den oprindelige faktura." },
      { when: "Returneringen er gyldig, varerne kan ikke sælges igen", then: "Varerne kasseres eller returneres til leverandøren; finans udsteder kreditnotaen, og tabet registreres." },
      { when: "Returneringen er ugyldig (fx uden for returfristen eller kundebeskadiget)", then: "Anmodningen afslås med skriftlig begrundelse; fakturaen består." },
      { when: "Mistanke om fejlbehæftet parti", then: "Serie- og partinumre fra plukket bruges til at spore og tilbagekalde andre berørte ordrer." }
    ]
  },
  "6": {
    title: "Fakturering & betaling",
    deptName: "Finansafdelingen",
    who: "Faktureringsmedarbejder / debitorbogholder",
    tasks: [
      "Udsted den endelige faktura ud fra de afsendte mængder og de aftalte betingelser.",
      "Følg betalingen, indtil den modtages, og afklar evt. spørgsmål fra kunden til fakturaen.",
      "Udlign den modtagne betaling på fakturaen (betalingsudligning)."
    ],
    outcomes: [
      { when: "Betalt til tiden", then: "Betalingen udlignes på fakturaen, og ordren går videre til ordreafrunding." },
      { when: "Betalingen er forsinket", then: "Gå videre til rykker- og inkassoprocessen." }
    ]
  },
  "6a": {
    title: "Rykkere & inkasso",
    deptName: "Finansafdelingen",
    who: "Debitorbogholderen, eskaleres til finanschefen",
    tasks: [
      "Send betalingsrykkere efter et fast rykkerskema (fx 7, 14 og 30 dage efter forfaldsdatoen).",
      "Ring til kunden, og aftal en betalingsdato, hvis rykkerne forbliver ubesvarede.",
      "Eskalér kunder, der vedvarende ikke betaler."
    ],
    outcomes: [
      { when: "Kunden betaler efter rykkerne", then: "Betalingen udlignes, kundens betingelser genoptages, og ordren går videre til ordreafrunding." },
      { when: "Stadig ubetalt efter eskalering", then: "Kontoen blokeres: nye ordrer sættes automatisk på kreditstop i kreditvurderingen, indtil beløbet er betalt." },
      { when: "Formel inkasso eller afskrivning", then: "Håndteres efter virksomhedens politik; udfaldet registreres på kundekartoteket til fremtidige kreditbeslutninger." }
    ]
  },
  "7": {
    title: "Ordreafrunding",
    deptName: "Finansafdelingen",
    who: "Faktureringsmedarbejder / debitorbogholder, godkendes af finanschefen",
    tasks: [
      "Afstem ordren i regnskabet: alle linjer afsendt, faktureret og betalt.",
      "Løs tilbageværende justeringer (kreditnotaer, rabatter, skadeskrav), inden der arkiveres.",
      "Markér ordren som afsluttet, arkivér dokumenterne (ordre, faktura, leveringsbevis, RMA-papirer), og registrér gennemløbstiden til nøgletalrapporten."
    ],
    outcomes: [
      { when: "Alt er afstemt", then: "Ordren markeres som afsluttet og arkiveres. Ordren er lukket." },
      { when: "Der mangler stadig justeringer", then: "Afrundingen venter, til hver enkelt er løst — ordrer arkiveres aldrig med åbne beløb." }
    ]
  }
};
