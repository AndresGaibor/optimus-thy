# UnUQ: A Next-Generation Usability Evaluation Questionnaire Integrating ISO Standards and User-Validated Scales

> **Nota de conversión:** Transcripción completa del artículo en su idioma original (inglés), organizada por página. Se conservan sus datos, tablas, referencias y posibles inconsistencias. Las palabras divididas por un salto de línea se reúnen en el texto de lectura. Cada página incluye una extracción literal de respaldo, sin esas modificaciones. La descripción de la figura y la nota sobre la ecuación se identifican como adiciones de conversión. Los encabezados de plantilla («F. Author and S. Author» y «Contribution Title (shortened if too long)») se conservan en las transcripciones literales y en los originales visuales.
>
> El paquete ZIP contiene este Markdown, los recursos de imagen, las 12 páginas como imágenes, la extracción literal y el PDF original intacto. Conservar la carpeta `assets` junto al Markdown para visualizar las imágenes.

## Página 1

**UnUQ: A Next-Generation Usability Evaluation Questionnaire Integrating ISO Standards and User-Validated Scales**

**Autores (con los identificadores impresos en el original):**

- Diego Avila-Pesantez¹ — ORCID: 0000-0001-8394-5621.
- Jorge Hernandez-Ambato² — ORCID: 0000-0002-1841-2789.
- Ramiro Isa-Jara¹ — ORCID: 0000-0001-8394-5621.
- L. Miriam Avila¹ — ORCID: 0000-0001-9421-287X.

**Afiliación 1:** Escuela Superior Politecnica de Chimborazo (ESPOCH), Facultad de Informática y Electrónica, Riobamba, 06025. Ecuador.

**Correo:** davila@espoch.edu.ec.

> Nota de conversión: el PDF muestra el superíndice 2 para Jorge Hernandez-Ambato, pero no desarrolla una segunda afiliación en la portada. Se conserva ese dato sin completarlo por inferencia.

Abstract. Usability evaluation plays a critical role in improving user experience and ensuring the quality of interactive systems. Although standardized tests are commonly used, they tend to evaluate usability in separate dimensions, resulting in partial and fragmented results. This article presents UnUQ (Unified Usability Questionnaire), a novel evaluation tool that integrates key ISO/IEC standards— 25010, 25062, and 9241-11—along with Jakob Nielsen’s usability heuristics and well-established usability scales, including SUS, CSUQ, QUIS, and UMUX. The seven attributes that define UnUQ were identified through a clustering analysis of usability metrics, supported by a comprehensive literature review to ensure both conceptual soundness and theoretical grounding. Designed as a single instrument with 22 items, UnUQ provides a unified framework for evaluating core usability aspects, including effectiveness, efficiency, satisfaction, learning and memorability, accessibility, overall usability, and acceptance. Its purpose is to bridge the gap between formal standards and practical evaluation tools, thereby improving consistency and comparability of results across various digital environments.

Keywords: Usability questionnaire, Human-Computer Interaction, UnUQ, ISO Standards.

### 1 Introduction

The Human-Computer Interaction (HCI) field considers IT system evaluation a crucial step in ensuring the quality of interactive applications [1]. Research indicates that conducting early, systematic reviews can significantly reduce the cost and effort required to address usability issues later on [2]. In this process, usability stands out as the primary focus of evaluation [3]. It is viewed as a core quality attribute. This attribute reflects how easily users can operate and navigate an interface [3]. User experience (UX) and user interface (UI) are keys to the success of any digital product, and usability measurement becomes an essential pillar for the continuous improvement of systems [4]. It enables the identification of interaction problems, such as navigation difficulties,

<details>
<summary>Transcripción literal de la página 1</summary>

```text
      UnUQ: A Next-Generation Usability Evaluation
     Questionnaire Integrating ISO Standards and User-
                      Validated Scales

    Diego Avila-Pesantez1[0000-0001-8394-5621] Jorge Hernandez-Ambato2[0000-0002-1841-2789]
          Ramiro Isa-Jara1[0000-0001-8394-5621] and L. Miriam Avila 1[0000-0001-9421-287X]
 1 Escuela Superior Politecnica de Chimborazo (ESPOCH), Facultad de Informática y Electró-

                                 nica, Riobamba, 06025. Ecuador
                                  davila@espoch.edu.ec



        Abstract. Usability evaluation plays a critical role in improving user experience
        and ensuring the quality of interactive systems. Although standardized tests are
        commonly used, they tend to evaluate usability in separate dimensions, resulting
        in partial and fragmented results. This article presents UnUQ (Unified Usability
        Questionnaire), a novel evaluation tool that integrates key ISO/IEC standards—
        25010, 25062, and 9241-11—along with Jakob Nielsen’s usability heuristics and
        well-established usability scales, including SUS, CSUQ, QUIS, and UMUX. The
        seven attributes that define UnUQ were identified through a clustering analysis
        of usability metrics, supported by a comprehensive literature review to ensure
        both conceptual soundness and theoretical grounding. Designed as a single in-
        strument with 22 items, UnUQ provides a unified framework for evaluating core
        usability aspects, including effectiveness, efficiency, satisfaction, learning and
        memorability, accessibility, overall usability, and acceptance. Its purpose is to
        bridge the gap between formal standards and practical evaluation tools, thereby
        improving consistency and comparability of results across various digital envi-
        ronments.


        Keywords: Usability questionnaire, Human-Computer Interaction, UnUQ, ISO
        Standards.


1       Introduction

The Human-Computer Interaction (HCI) field considers IT system evaluation a crucial
step in ensuring the quality of interactive applications [1]. Research indicates that con-
ducting early, systematic reviews can significantly reduce the cost and effort required
to address usability issues later on [2]. In this process, usability stands out as the pri-
mary focus of evaluation [3]. It is viewed as a core quality attribute. This attribute re-
flects how easily users can operate and navigate an interface [3]. User experience (UX)
and user interface (UI) are keys to the success of any digital product, and usability
measurement becomes an essential pillar for the continuous improvement of systems
[4]. It enables the identification of interaction problems, such as navigation difficulties,
```

</details>

## Página 2

2 F. Author and S. Author

inconsistency, slow response times, limited accessibility, inadequate feedback, complex interfaces, or poor interaction [5]. Various international standards, such as ISO/IEC 25010:2023, ISO/IEC 25062:2025, and ISO 9241-11:2018, provide a robust framework for measuring usability attributes (such as effectiveness, efficiency, and user satisfaction), ensuring that applications are functional, intuitive, and pleasant [6-8]. In addition to formal standards, Jakob Nielsen’s usability heuristics provide a set of ten principles for user interface design that support fast and effective system evaluations. These heuristics address key aspects such as ease of learning, error prevention, and visual and functional consistency [9]. Rather than prescriptive rules, they serve as flexible guidelines that help to uncover usability issues across various interactive systems. On the other hand, several standardized questionnaires are commonly applied to assess the usability of interactive systems, collecting both demographic information and user feedback [10]. Popular instruments include SUS, CSUQ, QUIS, and UMUX [11, 12]. However, current methods remain fragmented and sometimes redundant, lacking unified theoretical bases and consistent measurement levels. The Unified Usability Questionnaire (UnUQ) addresses this by combining ISO standards, heuristic principles, and validated metrics. This integration supports more accurate evaluations, enables result comparability, and guides designers in improving interfaces and overall user experience. The article is structured as follows. Section 1 introduces the problem addressed and the proposed solution. Section 2 presents the categories of usability-related ISO standards and the most used instruments for measuring usability attributes, integrated with Nielsen’s heuristics to provide a holistic assessment questionnaire. Section 3 describes the design of the UnUQ instrument. Section 4 summarizes the conclusions and provides directions for future research.

### 2 Background

In large-scale projects, combining multiple international standards helps ensure robust usability assessment. This study applies ISO/IEC 25010:2023, ISO/IEC 25062:2025, and ISO 9241-11:2018 for their relevance and complementarity. These standards are widely recognized in human–computer interaction research [11].

### 2.1 ISO 25010:2023

ISO/IEC 25010 provides a structured framework for evaluating software and IT systems, aiming to improve the overall user experience [7]. The 2023 update describes interaction capability as a product’s ability to enable effective communication through its interface, supporting the exchange of information needed for task completion. The standard outlines key attributes to ensure user satisfaction, operational efficiency, and core functionality. Usability testing based on interaction capability helps detect weaknesses and guide improvements for smooth, barrier-free navigation, even in complex scenarios. Consequently, ISO/IEC 25010 is a vital reference for achieving high usability and interactive performance [12]. It also specifies eight sub-characteristics used to assess interaction capability (see Table 1).

<details>
<summary>Transcripción literal de la página 2</summary>

```text
2       F. Author and S. Author


inconsistency, slow response times, limited accessibility, inadequate feedback, com-
plex interfaces, or poor interaction [5]. Various international standards, such as
ISO/IEC 25010:2023, ISO/IEC 25062:2025, and ISO 9241-11:2018, provide a robust
framework for measuring usability attributes (such as effectiveness, efficiency, and user
satisfaction), ensuring that applications are functional, intuitive, and pleasant [6-8]. In
addition to formal standards, Jakob Nielsen’s usability heuristics provide a set of ten
principles for user interface design that support fast and effective system evaluations.
These heuristics address key aspects such as ease of learning, error prevention, and
visual and functional consistency [9]. Rather than prescriptive rules, they serve as flex-
ible guidelines that help to uncover usability issues across various interactive systems.
On the other hand, several standardized questionnaires are commonly applied to assess
the usability of interactive systems, collecting both demographic information and user
feedback [10]. Popular instruments include SUS, CSUQ, QUIS, and UMUX [11, 12].
However, current methods remain fragmented and sometimes redundant, lacking uni-
fied theoretical bases and consistent measurement levels. The Unified Usability Ques-
tionnaire (UnUQ) addresses this by combining ISO standards, heuristic principles, and
validated metrics. This integration supports more accurate evaluations, enables result
comparability, and guides designers in improving interfaces and overall user experi-
ence.
The article is structured as follows. Section 1 introduces the problem addressed and the
proposed solution. Section 2 presents the categories of usability-related ISO standards
and the most used instruments for measuring usability attributes, integrated with Niel-
sen’s heuristics to provide a holistic assessment questionnaire. Section 3 describes the
design of the UnUQ instrument. Section 4 summarizes the conclusions and provides
directions for future research.


2      Background

In large-scale projects, combining multiple international standards helps ensure robust
usability assessment. This study applies ISO/IEC 25010:2023, ISO/IEC 25062:2025,
and ISO 9241-11:2018 for their relevance and complementarity. These standards are
widely recognized in human–computer interaction research [11].

2.1    ISO 25010:2023

ISO/IEC 25010 provides a structured framework for evaluating software and IT sys-
tems, aiming to improve the overall user experience [7]. The 2023 update describes
interaction capability as a product’s ability to enable effective communication through
its interface, supporting the exchange of information needed for task completion. The
standard outlines key attributes to ensure user satisfaction, operational efficiency, and
core functionality. Usability testing based on interaction capability helps detect weak-
nesses and guide improvements for smooth, barrier-free navigation, even in complex
scenarios. Consequently, ISO/IEC 25010 is a vital reference for achieving high usabil-
ity and interactive performance [12]. It also specifies eight sub-characteristics used to
assess interaction capability (see Table 1).
```

</details>

## Página 3

Contribution Title (shortened if too long) 3

Table 1. Key elements of Interaction Capability – ISO/IEC 25010:2023.

| Sub-categories | Description | Metric |
| --- | --- | --- |
| Appropriateness Recognizability | It denotes the extent to which users perceive that a product or software aligns with their needs, fulfills their expectations, and supports the achievement of their intended goals or tasks. | Recognition rating. Completion rate. Familiarity rate. Usefulness rating. |
| Learnability | The capability of the product or software that allows the user to learn its operation efficiently within a specified time and become familiar with the functions and tasks. | Ease of Learning. Time to learn. Help needed count. Proactive feedback. Training time. |
| Operability | The capability of the computer system or software allows the user to operate and control it easily. It should enable users to achieve their objectives with minimum effort, errors, and frustrations. | Ease of Use. Interaction fluency. Action success rate. Navigation steps. |
| User error protection | Ability of the website or platform software to prevent, protect, or mitigate user errors. The goal is to minimize mistakes and facilitate recovery from unwanted situations. | Error recovery time. Error prevention rate. Simplicity in interaction. Adequate feedback. |
| User engagement | It refers to the level and motivation of user involvement, the appealing and stimulating presentation of functions and information, and the support for sustained and continuous interaction. | Interface attractiveness. Engagement frequency. Interaction satisfaction. Emotional response score. |
| Inclusivity | This subcategory focuses on ensuring that a software product or system can be used by people with diverse backgrounds (age, abilities, culture, ethnicities, languages, economic and life situations, gender, and education), capabilities, and needs, allowing them to interact effectively. | Accessibility coverage. Inclusive design. Adaptability support. Keyboard navigation rate. |
| User assistance | The capability of a product or system that allows it to be used by users with specific characteristics and capabilities (hearing, sight, age, use of legs, arms, hands, etc.), achieving objectives in a context of use. | Self-help system rate. Assistance success rate. Customization support. Interactive guidance rate. |
| Self-descriptiveness | This component ensures that a product provides clear, immediate information, allowing users to understand its use without requiring additional help, thereby reducing cognitive load and making it selfexplanatory. | User autonomy. Instruction readability. Interactive guidance. Task explanation success. |

<details>
<summary>Transcripción literal de la página 3</summary>

```text
                                             Contribution Title (shortened if too long)         3


           Table 1. Key elements of Interaction Capability – ISO/IEC 25010:2023.

Sub-categories Description                                             Metric
Appropriateness It denotes the extent to which users perceive that a   Recognition rating.
Recognizability product or software aligns with their needs, fulfills  Completion rate.
                their expectations, and supports the achievement of    Familiarity rate.
                their intended goals or tasks.                         Usefulness rating.
Learnability    The capability of the product or software that al-     Ease of Learning. Time
                lows the user to learn its operation efficiently       to learn. Help needed
                within a specified time and become familiar with       count.
                the functions and tasks.                               Proactive feedback.
                                                                       Training time.
Operability     The capability of the computer system or software Ease of Use.
                allows the user to operate and control it easily. It   Interaction fluency.
                should enable users to achieve their objectives with Action success rate.
                minimum effort, errors, and frustrations.              Navigation steps.
User error pro- Ability of the website or platform software to pre- Error recovery time. Er-
tection         vent, protect, or mitigate user errors. The goal is to ror prevention rate. Sim-
                minimize mistakes and facilitate recovery from un- plicity in interaction.
                wanted situations.                                     Adequate feedback.

User     engage- It refers to the level and motivation of user involve- Interface attractiveness.
ment             ment, the appealing and stimulating presentation of Engagement frequency.
                 functions and information, and the support for sus- Interaction satisfaction.
                 tained and continuous interaction.                     Emotional response
                                                                        score.
Inclusivity      This subcategory focuses on ensuring that a soft-      Accessibility coverage.
                 ware product or system can be used by people with Inclusive design. Adapt-
                 diverse backgrounds (age, abilities, culture, ethnici- ability support. Key-
                 ties, languages, economic and life situations, gen- board navigation rate.
                 der, and education), capabilities, and needs, allow-
                 ing them to interact effectively.
User assistance The capability of a product or system that allows it Self-help system rate.
                 to be used by users with specific characteristics and Assistance success rate.
                 capabilities (hearing, sight, age, use of legs, arms, Customization support.
                 hands, etc.), achieving objectives in a context of     Interactive guidance rate.
                 use.
Self-descrip-    This component ensures that a product provides         User autonomy. Instruc-
tiveness         clear, immediate information, allowing users to un-    tion readability.
                 derstand its use without requiring additional help,    Interactive guidance.
                 thereby reducing cognitive load and making it self-    Task explanation suc-
                 explanatory.                                           cess.
```

</details>

## Página 4

4 F. Author and S. Author

### 2.2 ISO 25062:2025

ISO/IEC 25062, part of the SQuaRE series, provides a standard format for reporting usability evaluation results (ISO, 2025). It emphasizes effectiveness, efficiency, and user satisfaction when using a system. The standard describes methods like user testing, task analysis, and heuristic reviews, presenting both quantitative and qualitative data. Metrics include goal completion, time taken, errors, and perceived satisfaction [8]. Aligned with ISO 9241-210, it supports a user-centered approach across the product lifecycle, as shown in Table 2.

### 2.3 ISO 9241-11:2018

ISO 9241-11:2018 is a key international standard for evaluating the usability of interactive systems, emphasizing a user-centered approach over purely technical measures [6]. It defines usability as the ability of specific users to achieve defined goals effectively, efficiently, and with satisfaction in each context. The standard emphasizes that usability depends on real-world conditions, considering users, tasks, tools, equipment, and the environment. Three core metrics (effectiveness, efficiency, and satisfaction) allow for evaluating both design quality and adaptability to specific situations. ISO 9241-11 is also consistent with formats such as ISO/IEC 25062, supporting usability assessments across diverse technology domains (see Table 2).

Table 2. Summary of the attributes analyzed in ISO 25062 and ISO 9241-11.

| Sub-categories | Description | Metric |
| --- | --- | --- |
| Effectiveness | The degree to which users achieve specified objectives with accuracy and completeness. | Task success rate. Number of errors. Error recovery. Completion rate. |
| Efficiency | Resources were used to determine the accuracy and completeness achieved. | Response time. Cognitive/Mental workload. Click efficiency. Functional suitability. |
| User Satisfaction | A combination of specific users, tasks, equipment (hardware, software, and materials), and the physical and social environments in which a product or system is used. | User profile match. Task relevance rate. Device compatibility. Setting suitability. |

### 2.4 Nielsen Heuristic

The scientific and professional interface design community widely accepts the Nielsen heuristic as one of the most recognized approaches to usability evaluation. It allows the identification of interaction problems in user interfaces [13]. Heuristics comprise ten general principles that serve as guidelines for usability evaluation, enabling the detection of deficiencies without the need for formal user testing. Their simplicity, crosscutting applicability to various software types, and empirical basis have consolidated their use in research on graphic interfaces, mobile applications, and digital educational environments [14]. Specifically, they focus on system state visibility, user control, error

<details>
<summary>Transcripción literal de la página 4</summary>

```text
4       F. Author and S. Author


2.2    ISO 25062:2025

ISO/IEC 25062, part of the SQuaRE series, provides a standard format for reporting
usability evaluation results (ISO, 2025). It emphasizes effectiveness, efficiency, and
user satisfaction when using a system. The standard describes methods like user testing,
task analysis, and heuristic reviews, presenting both quantitative and qualitative data.
Metrics include goal completion, time taken, errors, and perceived satisfaction [8].
Aligned with ISO 9241-210, it supports a user-centered approach across the product
lifecycle, as shown in Table 2.

2.3    ISO 9241-11:2018

ISO 9241-11:2018 is a key international standard for evaluating the usability of inter-
active systems, emphasizing a user-centered approach over purely technical measures
[6]. It defines usability as the ability of specific users to achieve defined goals effec-
tively, efficiently, and with satisfaction in each context. The standard emphasizes that
usability depends on real-world conditions, considering users, tasks, tools, equipment,
and the environment. Three core metrics (effectiveness, efficiency, and satisfaction)
allow for evaluating both design quality and adaptability to specific situations. ISO
9241-11 is also consistent with formats such as ISO/IEC 25062, supporting usability
assessments across diverse technology domains (see Table 2).

        Table 2. Summary of the attributes analyzed in ISO 25062 and ISO 9241-11.

Sub-categories      Description                            Metric
Effectiveness       The degree to which users achieve Task success rate. Number of errors.
                    specified objectives with accuracy Error recovery.
                    and completeness.                      Completion rate.
Efficiency          Resources were used to determine the Response time. Cognitive/Mental
                    accuracy and completeness achieved. workload. Click efficiency. Functio-
                                                           nal suitability.
User Satisfaction   A combination of specific users, User profile match.
                    tasks, equipment (hardware, soft- Task relevance rate.
                    ware, and materials), and the physical Device compatibility.
                    and social environments in which a Setting suitability.
                    product or system is used.

2.4    Nielsen Heuristic

The scientific and professional interface design community widely accepts the Nielsen
heuristic as one of the most recognized approaches to usability evaluation. It allows the
identification of interaction problems in user interfaces [13]. Heuristics comprise ten
general principles that serve as guidelines for usability evaluation, enabling the detec-
tion of deficiencies without the need for formal user testing. Their simplicity, cross-
cutting applicability to various software types, and empirical basis have consolidated
their use in research on graphic interfaces, mobile applications, and digital educational
environments [14]. Specifically, they focus on system state visibility, user control, error
```

</details>

## Página 5

Contribution Title (shortened if too long) 5

prevention, and minimalist aesthetic design. Table 3 displays these principles, which are often used as evaluation criteria for redesigning iterative systems.

Table 3. Key Usability Metrics Mapped to Nielsen’s Ten Heuristic Principles.

| Heuristic principles | Description | Metric |
| --- | --- | --- |
| Visibility of system status | The system should keep users informed about what is happening through clear and timely feedback. | Response time. System status indicator. Error prevention level. Feedback. |
| Matching the system to the real world | The interface should employ a familiar language to users, following real-world conventions to facilitate understanding. | Content relevance. Training time. Understandable terminology. Overall satisfaction. |
| User control and freedom | Users should be able to easily undo or redo actions, preventing them from being trapped in unwanted processes. | Navigation freedom. Comfort Percentage. Frequency of use. |
| Consistency and standards | The system should follow uniform patterns, and user standards should be respected. | Visual and functional uniformity. Control behavior. |
| Error prevention | The design should minimize error-causing conditions and provide precise error avoidance mechanisms. | Visual and functional uniformity. Control behavior. Frequency of use. |
| Flexibility and efficiency of use | The interface should minimize information overload and display only the information relevant to the current task. | Error recovery. User confidence. Clarity. Ease of use. |
| Aesthetic and minimalist design | The system should offer shortcuts or advanced functions for expert users without compromising the ease of use for beginners. | Cognitive clarity. Interface clutter. Aesthetic appeal. |
| Help users recognize | Error messages should be written clearly, indicating the problem and possible solutions. | Error recovery. User confidence. Clarity. Ease of use. |
| Help and documentation | Although the system should ideally be intuitive, accessible help should be available to guide the user when needed. | Error message. Helpfulness. Task success rate. User independence. |

### 2.5 Usability evaluation questionnaire

Standardized questionnaires, such as the SUS (System Usability Scale), CSUQ (Computer System Usability Questionnaire), QUIS (Questionnaire for User Interaction Satisfaction), and UMUX (Usability Metric for User Experience), are widely used to assess the perceived usability of interactive systems [15]. SUS is a quick 10-item survey assessing overall usability and is well-validated. CSUQ focuses on system, information, and interface quality using a detailed 7-point scale. QUIS evaluates multiple user experience factors, including feedback and error messages. UMUX offers a shorter, 4-item option aligned with ISO standards, suitable for fast assessments. Each tool provides

<details>
<summary>Transcripción literal de la página 5</summary>

```text
                                           Contribution Title (shortened if too long)     5


prevention, and minimalist aesthetic design. Table 3 displays these principles, which
are often used as evaluation criteria for redesigning iterative systems.

        Table 3. Key Usability Metrics Mapped to Nielsen’s Ten Heuristic Principles.

Heuristic principles  Description                                  Metric
Visibility of system  The system should keep users informed about Response time. System
status                what is happening through clear and timely status indicator. Error
                      feedback.                                    prevention level.
                                                                   Feedback.
Matching the system The interface should employ a familiar lan- Content relevance. Train-
to the real world     guage to users, following real-world conven- ing time. Understandable
                      tions to facilitate understanding.           terminology. Overall sa-
                                                                   tisfaction.
User control and      Users should be able to easily undo or redo Navigation freedom.
freedom               actions, preventing them from being trapped Comfort Percentage.
                      in unwanted processes.                       Frequency of use.
Consistency and stan- The system should follow uniform patterns, Visual and functional
dards                 and user standards should be respected.      uniformity. Control be-
                                                                   havior.
Error prevention      The design should minimize error-causing     Visual and functional
                      conditions and provide precise error avoid- uniformity. Control be-
                      ance mechanisms.                             havior. Frequency of use.
Flexibility and effi- The interface should minimize information Error recovery. User con-
ciency of use         overload and display only the information    fidence. Clarity.
                      relevant to the current task.                Ease of use.
Aesthetic and mini-   The system should offer shortcuts or ad-     Cognitive clarity. Inter-
malist design         vanced functions for expert users without    face clutter.
                      compromising the ease of use for beginners. Aesthetic appeal.
Help users recognize Error messages should be written clearly, in- Error recovery. User con-
                      dicating the problem and possible solutions. fidence. Clarity.
                                                                   Ease of use.
Help and documenta- Although the system should ideally be intui- Error message. Helpful-
tion                  tive, accessible help should be available to ness. Task success rate.
                      guide the user when needed.                  User independence.

2.5    Usability evaluation questionnaire

Standardized questionnaires, such as the SUS (System Usability Scale), CSUQ (Com-
puter System Usability Questionnaire), QUIS (Questionnaire for User Interaction Sat-
isfaction), and UMUX (Usability Metric for User Experience), are widely used to as-
sess the perceived usability of interactive systems [15]. SUS is a quick 10-item survey
assessing overall usability and is well-validated. CSUQ focuses on system, information,
and interface quality using a detailed 7-point scale. QUIS evaluates multiple user expe-
rience factors, including feedback and error messages. UMUX offers a shorter, 4-item
option aligned with ISO standards, suitable for fast assessments. Each tool provides
```

</details>

## Página 6

6 F. Author and S. Author

unique insights but using them in isolation may yield incomplete results. Table 4 presents a summary.

Table 4. Overview of Standardized Usability Questionnaires

| Questionary | Description | Metric |
| --- | --- | --- |
| SUS | A brief 10-item questionnaire is widely used to measure the general perception of a system’s usability. It is one of the most validated instruments and applicable to various contexts. | Perceived ease of use. Task success rate. Usage efficiency. Frequency of use. Help needed first use. User confidence level. Perceived/level usefulness. Consistency level. |
| CSUQ | Developed by IBM, it evaluates user experience with computer systems using 19 items distributed across three dimensions: system quality, information quality, and interface quality. | Task success rate. Usefulness level. Information quality. Confidence level or frustration. Perceived ease of use. Aesthetic quality. Response time. Consistency level. Preference percentage. Memory reliance. |
| QUIS | An instrument developed by the University of Maryland to measure user satisfaction in multiple dimensions of interaction, such as feedback, error handling, data entry, and presentation. | User performance. Interface consistency. Feedback clarity. Usage efficiency. Frequency of use. Ease of learning. Familiarity rate. |
| UMUX | It is a brief, four-question tool that measures perceived usability according to the ISO 9241-11 definition. Its simple design makes it ideal for agile projects and repeated evaluations. | Usage efficiency. Perceived usefulness. Functional adequacy. Perceived ease of use. Confidence level or frustration. Familiarity rate. Information quality. Content relevance. |

### 3 Methodology

This section outlines the methodological foundation for constructing the UNUQ questionnaire and details the derivation of its core usability attributes. Drawing on theoretical frameworks and empirical instruments, which were identified and grouped semantically and conceptually aligned usability metrics.

### 3.1 Clustering analysis

Cluster analysis was used to group similar elements into consistent categories. This method helped define the main attributes for measuring system usability. The study applied a theoretical-semantic approach to combine indicators from international standards, usability heuristics, and well-known questionnaires. A review of definitions and functions produced 115 metrics from ISO/IEC standards, Nielsen principles, and questionnaires. Redundant items pointing to the same concept were merged, ensuring semantic and theoretical consistency. Metrics were coded by frequency, coverage, and relevance to user experience. Only attributes supported by at least three independent

<details>
<summary>Transcripción literal de la página 6</summary>

```text
6        F. Author and S. Author


unique insights but using them in isolation may yield incomplete results. Table 4 pre-
sents a summary.

                 Table 4. Overview of Standardized Usability Questionnaires

Questionary Description                                     Metric
  SUS       A brief 10-item questionnaire is widely         Perceived ease of use. Task success
            used to measure the general perception of a rate. Usage efficiency. Frequency of
            system’s usability. It is one of the most vali- use. Help needed first use. User con-
            dated instruments and applicable to various fidence level. Perceived/level useful-
            contexts.                                       ness. Consistency level.
  CSUQ      Developed by IBM, it evaluates user experi- Task success rate. Usefulness level.
            ence with computer systems using 19 items Information quality. Confidence
            distributed across three dimensions: system level or frustration. Perceived ease
            quality, information quality, and interface of use. Aesthetic quality. Response
            quality.                                        time. Consistency level. Preference
                                                            percentage. Memory reliance.
      QUIS   An instrument developed by the University User performance. Interface con-
             of Maryland to measure user satisfaction in sistency. Feedback clarity. Usage ef-
             multiple dimensions of interaction, such as ficiency. Frequency of use. Ease of
             feedback, error handling, data entry, and      learning. Familiarity rate.
             presentation.
      UMUX   It is a brief, four-question tool that         Usage efficiency. Perceived useful-
             measures perceived usability according to ness. Functional adequacy. Per-
             the ISO 9241-11 definition. Its simple de- ceived ease of use. Confidence level
             sign makes it ideal for agile projects and re- or frustration. Familiarity rate. Infor-
             peated evaluations.                            mation quality. Content relevance.


3       Methodology

This section outlines the methodological foundation for constructing the UNUQ ques-
tionnaire and details the derivation of its core usability attributes. Drawing on theoret-
ical frameworks and empirical instruments, which were identified and grouped seman-
tically and conceptually aligned usability metrics.

3.1     Clustering analysis

Cluster analysis was used to group similar elements into consistent categories. This
method helped define the main attributes for measuring system usability. The study
applied a theoretical-semantic approach to combine indicators from international stand-
ards, usability heuristics, and well-known questionnaires. A review of definitions and
functions produced 115 metrics from ISO/IEC standards, Nielsen principles, and ques-
tionnaires. Redundant items pointing to the same concept were merged, ensuring se-
mantic and theoretical consistency. Metrics were coded by frequency, coverage, and
relevance to user experience. Only attributes supported by at least three independent
```

</details>

## Página 7

Contribution Title (shortened if too long) 7

sources were kept, resulting in seven key usability factors: effectiveness, efficiency, satisfaction, learnability/memorability, accessibility, usefulness, and acceptability, shown in Table 5.

Table 5. Attribute-Based Grouping of Usability Metrics.

| Attribute | ISO 25010 | ISO 25062 | ISO 9241-11 | Nielsen | SUS | CSUQ | QUIS | UMUX |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Effectivity | \* | \* |  | \* |  |  |  |  |
| Functional suitability / adequacy |  | \* | \* |  |  |  | \* |  |
| Task success rate | \* | \* | \* | \* | \* | \* |  |  |
| User performance | \* | \* | \* | \* |  |  | \* |  |
| Efficiency |  |  |  | \* | \* |  |  |  |
| Response time | \* | \* | \* | \* |  |  |  |  |
| Click efficiency |  | \* | \* |  |  |  |  |  |
| Shortcut availability |  |  | \* |  |  |  | \* |  |
| Time to recover | \* | \* | \* |  |  |  |  |  |
| Usage efficiency | \* | \* | \* | \* | \* |  | \* | \* |
| Satisfaction |  |  | \* |  | \* | \* | \* |  |
| Sense of accomplishment | \* | \* |  |  |  |  |  |  |
| Feedback level | \* | \* | \* | \* |  |  | \* |  |
| Confidence level/frustration | \* | \* |  | \* |  |  |  |  |
| Comfort/preference percentage | \* | \* | \* | \* |  |  |  |  |
| Frequency of use |  |  | \* | \* |  |  | \* |  |
| Learnability /Memorability |  |  |  | \* | \* | \* | \* |  |
| Cognitive workload | \* | \* | \* | \* |  |  |  |  |
| Ease of learning | \* | \* | \* | \* | \* | \* | \* | \* |
| Help needed first use | \* |  |  | \* |  |  |  |  |
| Memory reliance | \* |  |  | \* |  |  |  |  |
| Accessibility | \* |  | \* |  |  |  |  |  |
| User profile match | \* | \* | \* |  |  |  |  |  |
| Device/navigation compatibility |  | \* | \* |  |  |  |  |  |
| User independence |  |  | \* | \* |  |  |  |  |
| Aesthetic appeal/quality | \* | \* | \* | \* |  |  | \* |  |
| Usefulness | \* |  |  | \* | \* | \* |  |  |
| Content relevance |  |  | \* |  |  |  | \* |  |
| Perceived usefulness | \* | \* | \* | \* | \* | \* | \* | \* |
| Familiarity rate | \* |  |  | \* |  | \* |  |  |
| Information/Interaction quality | \* | \* | \* | \* |  | \* |  |  |
| Acceptance | \* |  | \* |  | \* | \* |  |  |
| Perceived ease of use | \* | \* | \* | \* | \* |  | \* |  |
| User confidence level |  | \* | \* | \* |  |  |  |  |
| Consistency level | \* |  |  | \* |  | \* |  |  |

<details>
<summary>Transcripción literal de la página 7</summary>

```text
                                                 Contribution Title (shortened if too long)       7


sources were kept, resulting in seven key usability factors: effectiveness, efficiency,
satisfaction, learnability/memorability, accessibility, usefulness, and acceptability,
shown in Table 5.

                        Table 5. Attribute-Based Grouping of Usability Metrics.

Attribute                    ISO 25010   ISO 25062 ISO 9241-11     Nielsen SUS CSUQ QUIS UMUX
Effectivity                  *           *                         *
Functional suitability /                 *           *                                 *
adequacy
Task success rate            *           *           *             *       *    *
User performance             *           *           *             *                   *
Efficiency                                                         *       *
Response time                *           *           *             *
Click efficiency                         *           *
Shortcut availability                                *                                 *
Time to recover              *           *           *
Usage efficiency             *           *           *             *       *           *      *
Satisfaction                                         *                     *    *      *
Sense of accomplishment      *           *
Feedback level               *           *           *             *                   *
Confidence level/frustra-    *           *                         *
tion
Comfort/preference per-      *           *           *             *
centage
Frequency of use                                     *             *                   *
Learnability /Memorability                                         *       *    *      *
Cognitive workload           *           *           *             *
Ease of learning             *           *           *             *       *    *      *      *
Help needed first use        *                                     *
Memory reliance              *                                     *
Accessibility                *                       *
User profile match       *               *           *
Device/navigation compa-                 *           *
tibility
User independence                                    *             *
Aesthetic appeal/quality     *           *           *             *                   *
Usefulness                   *                                     *       *    *
Content relevance                                    *                                 *
Perceived usefulness         *           *           *             *       *    *      *      *
Familiarity rate             *                                     *            *
Information/Interaction      *           *           *             *            *
quality
Acceptance                   *                       *                     *    *
Perceived ease of use        *           *           *             *       *           *
User confidence level                    *           *             *
Consistency level            *                                     *            *
```

</details>

## Página 8

8 F. Author and S. Author

This grouping process provided a solid base for the UnUQ questionnaire and its ability to measure usability in a precise and standardized way (see Fig. 1).

Fig. 1. Theoretical-Empirical Traceability with Attribute Labels. 3.2 UnUQ questionnaire

The seven key usability attributes guided the creation of 22 representative statements using a clustered cross-mapping method. Each statement was based on at least two empirical sources, and redundant content was removed through expert review. To strengthen content validity, a panel of five specialists in user experience and usability analysis independently assessed each item, ensuring alignment with ISO standards, Nielsen’s heuristics, and usability testing. The items were written to be simple, neutral, and suitable for various systems and user types, forming the UNUQ questionnaire. A pilot study was conducted with a total of 60 participants, including both educators and end-users, to evaluate the clarity, comprehensibility, and perceived relevance of each statement through online Google Forms. This diverse group was deliberately selected to represent both professional and practical perspectives, thereby ensuring that the questionnaire items were tested against different levels of expertise and familiarity with software systems. After completing the questionnaire, respondents were invited to provide open-ended comments on unclear, redundant, or ambiguous items, and in several cases, they offered detailed qualitative observations that enriched the analysis. A reliability analysis was conducted to complement this qualitative feedback. The overall Cronbach’s alpha coefficient was 0.86, which reflects a good level of internal consistency across the entire questionnaire. Also, it indicates that the items coherently measured the intended constructs. Subscale reliability indices also provided supportive evidence, ranging from 0.74 to 0.88 across the seven usability attributes—effectiveness, efficiency, satisfaction, learning/memorability, accessibility, usability support, and acceptance—demonstrating that each dimension was independently consistent while still

### Figura 1: descripción y transcripción añadidas

**Pie original:** Theoretical-Empirical Traceability with Attribute Labels.

El diagrama parte de **Usability Attributes**, que se divide en tres fuentes: **Normative Framework (ISO 2501, 25062, 9241-11)**, **Nielsen Heuristics** y **Empirical Evidence (SUS, CSUQ, QUIS, UMUX)**. La primera etiqueta se transcribe como aparece en la imagen: «ISO 2501», aunque el cuerpo del artículo utiliza ISO 25010.

En la parte inferior aparecen siete atributos: **Effectiveness**, **Efficiency**, **Satisfaction**, **Learnability/Memorability**, **Accessibility**, **Usefulness** y **Acceptance**. Las flechas negras, azules y verdes conectan las tres fuentes con esos atributos; las etiquetas intermedias muestran las métricas que sustentan la trazabilidad.

**Etiquetas de las métricas visibles:** Task success rate; User performance; Usage efficiency; Response Time; Feedback Level; Confort/Preference Percentage; Cognitive/Mental workload; Ease of learning; Functional suitability/adequacy; Response time; Frequency of use; User profile match; Aesthetic appeal/quality; Aesthetic quality; Content relevance; Perceived usefulness; Interaction quality; Perceived ease of use; Ease of use; Level usefulness. «Frequency of use», «Ease of learning» y «Usage efficiency» aparecen en varias conexiones.

El gráfico presenta una integración conceptual de estándares, heurísticas e instrumentos empíricos. No contiene porcentajes, coeficientes ni valores numéricos de validación. La matriz de la tabla 5 conserva por separado las marcas de correspondencia entre métricas y fuentes.

![Figura 1: trazabilidad teórico-empírica con etiquetas de atributos](assets/figura_01.png)

<details>
<summary>Transcripción literal de la página 8</summary>

```text
8         F. Author and S. Author


   This grouping process provided a solid base for the UnUQ questionnaire and its abil-
ity to measure usability in a precise and standardized way (see Fig. 1).




    Fig. 1. Theoretical-Empirical Traceability with Attribute Labels.

3.2     UnUQ questionnaire

The seven key usability attributes guided the creation of 22 representative statements
using a clustered cross-mapping method. Each statement was based on at least two em-
pirical sources, and redundant content was removed through expert review. To
strengthen content validity, a panel of five specialists in user experience and usability
analysis independently assessed each item, ensuring alignment with ISO standards,
Nielsen’s heuristics, and usability testing. The items were written to be simple, neutral,
and suitable for various systems and user types, forming the UNUQ questionnaire.

A pilot study was conducted with a total of 60 participants, including both educators
and end-users, to evaluate the clarity, comprehensibility, and perceived relevance of
each statement through online Google Forms. This diverse group was deliberately se-
lected to represent both professional and practical perspectives, thereby ensuring that
the questionnaire items were tested against different levels of expertise and familiarity
with software systems. After completing the questionnaire, respondents were invited to
provide open-ended comments on unclear, redundant, or ambiguous items, and in sev-
eral cases, they offered detailed qualitative observations that enriched the analysis. A
reliability analysis was conducted to complement this qualitative feedback. The overall
Cronbach’s alpha coefficient was 0.86, which reflects a good level of internal con-
sistency across the entire questionnaire. Also, it indicates that the items coherently
measured the intended constructs. Subscale reliability indices also provided supportive
evidence, ranging from 0.74 to 0.88 across the seven usability attributes—effectiveness,
efficiency, satisfaction, learning/memorability, accessibility, usability support, and ac-
ceptance—demonstrating that each dimension was independently consistent while still
```

</details>

## Página 9

Contribution Title (shortened if too long) 9

contributing to the overall construct. Additionally, item–total correlations were examined to identify weakly performing items, and those below recommended thresholds were flagged for review. An exploratory factor analysis was further performed to evaluate the extent to which the items clustered in alignment with the predefined usability attributes, providing evidence of construct validity. The integration of qualitative insights with these quantitative measures enabled the detection of comprehension problems, overlapping content, and potential redundancies that could compromise interpretability. Particular attention was also given to response times, skipped items, and patterns of identical answers, as these behavioral indicators offered indirect evidence of respondent fatigue or confusion. Based on these results, problematic items were systematically refined, reworded, or removed, ensuring that the final UNUQ set was precise, valid, reliable, and broadly applicable across different contexts and user populations. For reference, the detailed psychometric outcomes and refined item list are summarized in Table 6.

Table 6. Structure and Content of the UNUQ questionnaire.

| N.º | Statements | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| Effectiveness |  |  |  |  |  |  |
| S1 | The software helped me complete my tasks. |  |  |  |  |  |
| S2 | I found it easy to solve problems with this software. |  |  |  |  |  |
| S3 | The software was buggy during use. |  |  |  |  |  |
| Efficiency |  |  |  |  |  |  |
| S4 | The software completed my tasks quickly. |  |  |  |  |  |
| S5 | The software made it easy to access information and resources. |  |  |  |  |  |
| S6 | I needed someone to support me in using the software. |  |  |  |  |  |
| Satisfaction |  |  |  |  |  |  |
| S7 | I am satisfied with the ease of use of the software. |  |  |  |  |  |
| S8 | The software caused me frustration. |  |  |  |  |  |
| S9 | The software interface met my expectations. |  |  |  |  |  |
| Learning / Memorability |  |  |  |  |  |  |
| S10 | The software instructions facilitated my learning. |  |  |  |  |  |
| S11 | The software was easy to understand. |  |  |  |  |  |
| S12 | The software facilitated the acquisition of skills in my tasks. |  |  |  |  |  |
| S13 | I find it challenging to recall how the software works after a period of inactivity. |  |  |  |  |  |
| Accessibility |  |  |  |  |  |  |
| S14 | The software is accessible to people with visual, hearing, or learning difficulties. |  |  |  |  |  |
| S15 | The software allowed for text size, colors, and images to be adjusted. |  |  |  |  |  |
| S16 | I found it challenging to use the software due to navigation problems. |  |  |  |  |  |
| Usability |  |  |  |  |  |  |
| S17 | The software provided the necessary tools to accomplish my job. |  |  |  |  |  |
| S18 | The software lacked essential features to perform my tasks effectively. |  |  |  |  |  |
| S19 | The software has made my job easier. |  |  |  |  |  |
| Acceptance |  |  |  |  |  |  |
| S20 | I would be willing to continue using this software regularly. |  |  |  |  |  |
| S21 | The software has brought value to my daily tasks. |  |  |  |  |  |
| S22 | I was uncomfortable using this software. |  |  |  |  |  |

<details>
<summary>Transcripción literal de la página 9</summary>

```text
                                            Contribution Title (shortened if too long)       9


contributing to the overall construct. Additionally, item–total correlations were exam-
ined to identify weakly performing items, and those below recommended thresholds
were flagged for review. An exploratory factor analysis was further performed to eval-
uate the extent to which the items clustered in alignment with the predefined usability
attributes, providing evidence of construct validity. The integration of qualitative in-
sights with these quantitative measures enabled the detection of comprehension prob-
lems, overlapping content, and potential redundancies that could compromise interpret-
ability. Particular attention was also given to response times, skipped items, and pat-
terns of identical answers, as these behavioral indicators offered indirect evidence of
respondent fatigue or confusion. Based on these results, problematic items were sys-
tematically refined, reworded, or removed, ensuring that the final UNUQ set was pre-
cise, valid, reliable, and broadly applicable across different contexts and user popula-
tions. For reference, the detailed psychometric outcomes and refined item list are sum-
marized in Table 6.
  Table 6. Structure and Content of the UNUQ questionnaire.
N.º      Statements                                                                       12345
Effectiveness
S1       The software helped me complete my tasks.
S2       I found it easy to solve problems with this software.
S3       The software was buggy during use.
Efficiency
S4       The software completed my tasks quickly.
S5       The software made it easy to access information and resources.
S6       I needed someone to support me in using the software.
Satisfaction
S7       I am satisfied with the ease of use of the software.
S8       The software caused me frustration.
S9       The software interface met my expectations.
Learning / Memorability
S10      The software instructions facilitated my learning.
S11      The software was easy to understand.
S12      The software facilitated the acquisition of skills in my tasks.
S13      I find it challenging to recall how the software works after a period of inac-
         tivity.
Accessibility
S14      The software is accessible to people with visual, hearing, or learning difficul-
         ties.
S15      The software allowed for text size, colors, and images to be adjusted.
S16      I found it challenging to use the software due to navigation problems.
Usability
S17      The software provided the necessary tools to accomplish my job.
S18      The software lacked essential features to perform my tasks effectively.
S19      The software has made my job easier.
Acceptance
S20      I would be willing to continue using this software regularly.
S21      The software has brought value to my daily tasks.
S22      I was uncomfortable using this software.
```

</details>

## Página 10

10 F. Author and S. Author

The UNUQ questionnaire includes one negatively worded item in each of its seven attributes (S3, S6, S8, S13, S16, S18, and S22) to limit response bias. This approach, known as acquiescence control, discourages participants from automatically agreeing. Mixing positive and negative statements prompts more careful reading. It also improves the accuracy of responses and the quality of collected data. By reducing biased answers, the measurement of perceived usability becomes more reliable and valid. Scoring process The scoring procedure for the UNUQ questionnaire follows the structure of the SUS [15], adapting it to a 22-item format consisting of 15 positively worded statements and 7 negatively worded ones. Each item is rated on a 5-point Likert scale ranging from 1 (“strongly disagree”) to 5 (“strongly agree”). For scoring, positively worded items are recoded by subtracting 1 from the user's raw score (i.e., Score = Response – 1), while negatively worded items are reverse-coded by subtracting the response from 5 (i.e., Score = 5 – Response). This ensures that higher scores uniformly reflect more favorable usability perceptions. The total adjusted score is then summed across all items and normalized to a 0–100 scale by multiplying the result by 100/88 (since the maximum total score is 88). This standardized score enables consistent interpretation of usability across systems and facilitates comparison with other instruments, such as the SUS, while maintaining the broader conceptual coverage offered by the seven attributes in UNUQ (1).

UnUQ Score = ( ∑ tight points ) × 88/100 ≈ ∑ × 1.136 (1) Based on the article by John Brooke [16], the following adjective scale is proposed to interpret the scores of the UNUQ questionnaire on a scale of 0 to 100, following an approach similar to that used in interpreting the SUS, but adjusted to the extended characteristics of the UNUQ. Table 7 presents the descriptive scale used to analyze the UNUQ usability scores on a standardized scale of 0–100. This scale assigns qualitative adjectives to score intervals, providing a semantic classification that facilitates intuitive understanding of the results by researchers, designers, and stakeholders.

Table 7. Descriptive Scale for Interpreting UNUQ Usability Scores [16].

| UnUQ score (0–100) | Descriptive adjective | General interpretation |
| --- | --- | --- |
| 85–100 | Excellent | The system demonstrates outstanding usability. Users are delighted and intend to continue using the system. |
| 70–84 | Good | High perceived usability. The system is practical and comfortable for most users. |
| 50–69 | Fair | Sufficient usability. Although there may be minor issues, the system remains functional. |
| 30–49 | Poor | Limited usability. The system presents relevant obstacles that affect the experience. |
| 0–29 | Unacceptable | Serious usability deficiency. It may require a complete redesign to be usable. |

### Nota de conversión sobre la ecuación (1)

La ecuación está impresa así, incluida la expresión «tight points»:

```text
UnUQ Score = ( ∑ tight points ) × 88/100 ≈ ∑ × 1.136     (1)
```

Existe una discrepancia interna: el párrafo anterior prescribe **100/88**, mientras que la ecuación imprime **88/100**. Además, **100/88 ≈ 1.13636** y **88/100 = 0.88**. Por tanto, el factor decimal mostrado y la normalización del máximo de 88 a 100 son coherentes con el factor **100/88** descrito en el párrafo. Esta observación es una comprobación aritmética añadida en la conversión; no modifica la ecuación original transcrita arriba.

<details>
<summary>Transcripción literal de la página 10</summary>

```text
10       F. Author and S. Author


The UNUQ questionnaire includes one negatively worded item in each of its seven
attributes (S3, S6, S8, S13, S16, S18, and S22) to limit response bias. This approach,
known as acquiescence control, discourages participants from automatically agreeing.
Mixing positive and negative statements prompts more careful reading. It also improves
the accuracy of responses and the quality of collected data. By reducing biased answers,
the measurement of perceived usability becomes more reliable and valid.

Scoring process
The scoring procedure for the UNUQ questionnaire follows the structure of the SUS
[15], adapting it to a 22-item format consisting of 15 positively worded statements and
7 negatively worded ones. Each item is rated on a 5-point Likert scale ranging from 1
(“strongly disagree”) to 5 (“strongly agree”). For scoring, positively worded items are
recoded by subtracting 1 from the user's raw score (i.e., Score = Response – 1), while
negatively worded items are reverse-coded by subtracting the response from 5 (i.e.,
Score = 5 – Response). This ensures that higher scores uniformly reflect more favorable
usability perceptions. The total adjusted score is then summed across all items and nor-
malized to a 0–100 scale by multiplying the result by 100/88 (since the maximum total
score is 88). This standardized score enables consistent interpretation of usability across
systems and facilitates comparison with other instruments, such as the SUS, while
maintaining the broader conceptual coverage offered by the seven attributes in UNUQ
(1).

            UnUQ Score = ( ∑ tight points ) × 88/100 ≈ ∑ × 1.136               (1)

Based on the article by John Brooke [16], the following adjective scale is proposed to
interpret the scores of the UNUQ questionnaire on a scale of 0 to 100, following an
approach similar to that used in interpreting the SUS, but adjusted to the extended char-
acteristics of the UNUQ. Table 7 presents the descriptive scale used to analyze the
UNUQ usability scores on a standardized scale of 0–100. This scale assigns qualitative
adjectives to score intervals, providing a semantic classification that facilitates intuitive
understanding of the results by researchers, designers, and stakeholders.

  Table 7. Descriptive Scale for Interpreting UNUQ Usability Scores [16].
UnUQ score      Descriptive      General interpretation
(0–100)         adjective
85–100          Excellent        The system demonstrates outstanding usability. Users are de-
                                 lighted and intend to continue using the system.
70–84           Good             High perceived usability. The system is practical and com-
                                 fortable for most users.
50–69           Fair             Sufficient usability. Although there may be minor issues, the
                                 system remains functional.
30–49           Poor             Limited usability. The system presents relevant obstacles that
                                 affect the experience.
0–29            Unacceptable Serious usability deficiency. It may require a complete rede-
                                 sign to be usable.
```

</details>

## Página 11

Contribution Title (shortened if too long) 11

### 4 Conclusion

This study presented UnUQ, a novel usability evaluation questionnaire that integrates ISO/IEC standards, Jakob Nielsen’s heuristics, and consolidated usability scales. By conducting a literature review and a clustering analysis of existing usability metrics, the seven core attributes of UnUQ were identified, ensuring strong conceptual validity and theoretical alignment. It could consolidate disparate evaluation dimensions into a single instrument comprising 22 well-defined statements, enabling a comprehensive assessment of usability in terms of effectiveness, efficiency, satisfaction, learning/memorability, accessibility, usability, and acceptance. This integrative tool helps overcome the fragmented nature of existing instruments, enhancing consistency and comparability across different studies and application domains. Future work will focus on extensive empirical validation of UnUQ across diverse contexts and types of interactive systems to confirm its reliability and practical applicability in industry and academia.

Acknowledgments. The author, Diego Fernando Avila-Pesantez, acknowledges the financial support received from Fundación Carolina (Spain) and Escuela Superior Politécnica de Chimborazo (Ecuador) during his postdoctoral research stay in the ISE research group at the University of Castilla-La Mancha, within the framework of which this paper was developed.

### References

1. Ntoa, S., Usability and user experience evaluation in intelligent environments: a review and

reappraisal. International Journal of Human–Computer Interaction, 2025. 41(5): p. 2829- 2858. 2. Habib, H. and L.F. Cranor. Evaluating the usability of privacy choice mechanisms. in

Eighteenth Symposium on Usable Privacy and Security (SOUPS 2022). 2022. 3. Pinho, D., A. Aguiar, and V. Amaral, What about the usability in low-code platforms? A

systematic literature review. Journal of Computer Languages, 2023. 74: p. 101185. 4. Hamidli, N., Introduction to UI/UX design: key concepts and principles. Preuzeto, 2023. 28:

p. 2024. 5. Darejeh, A., et al., A critical analysis of cognitive load measurement methods for evaluating

the usability of different types of interfaces: guidelines and framework for Human-Computer Interaction. arXiv preprint arXiv:.11820, 2024. 6. ISO9241-11:2018. Ergonomics of human-system interaction. Part 11: Usability: Definitions

and concepts. 2018; Available from: https://www.iso.org/es/contents/data/standard/08/42/84255.html. 7. ISO/IEC25010:2023. Systems and software engineering — Systems and software Quality

Requirements and Evaluation (SQuaRE) — Product quality model. 2023; Available from: https://www.iso.org/es/contents/data/standard/07/81/78176.html. 8. ISO/IEC25062:2025. Software engineering—software product quality requirements and

evaluation (SQuaRE)-common industry format (CIF) for usability test reports. 2025; Available from: https://www.iso.org/es/contents/data/standard/08/42/84255.html.

<details>
<summary>Transcripción literal de la página 11</summary>

```text
                                             Contribution Title (shortened if too long)      11


4      Conclusion

This study presented UnUQ, a novel usability evaluation questionnaire that integrates
ISO/IEC standards, Jakob Nielsen’s heuristics, and consolidated usability scales. By
conducting a literature review and a clustering analysis of existing usability metrics,
the seven core attributes of UnUQ were identified, ensuring strong conceptual validity
and theoretical alignment. It could consolidate disparate evaluation dimensions into a
single instrument comprising 22 well-defined statements, enabling a comprehensive
assessment of usability in terms of effectiveness, efficiency, satisfaction, learn-
ing/memorability, accessibility, usability, and acceptance. This integrative tool helps
overcome the fragmented nature of existing instruments, enhancing consistency and
comparability across different studies and application domains. Future work will focus
on extensive empirical validation of UnUQ across diverse contexts and types of inter-
active systems to confirm its reliability and practical applicability in industry and aca-
demia.

Acknowledgments. The author, Diego Fernando Avila-Pesantez, acknowledges the financial
support received from Fundación Carolina (Spain) and Escuela Superior Politécnica de Chimbo-
razo (Ecuador) during his postdoctoral research stay in the ISE research group at the University
of Castilla-La Mancha, within the framework of which this paper was developed.


References

1. Ntoa, S., Usability and user experience evaluation in intelligent environments: a review and
   reappraisal. International Journal of Human–Computer Interaction, 2025. 41(5): p. 2829-
   2858.
2. Habib, H. and L.F. Cranor. Evaluating the usability of privacy choice mechanisms. in
   Eighteenth Symposium on Usable Privacy and Security (SOUPS 2022). 2022.
3. Pinho, D., A. Aguiar, and V. Amaral, What about the usability in low-code platforms? A
   systematic literature review. Journal of Computer Languages, 2023. 74: p. 101185.
4. Hamidli, N., Introduction to UI/UX design: key concepts and principles. Preuzeto, 2023. 28:
   p. 2024.
5. Darejeh, A., et al., A critical analysis of cognitive load measurement methods for evaluating
   the usability of different types of interfaces: guidelines and framework for Human-Computer
   Interaction. arXiv preprint arXiv:.11820, 2024.
6. ISO9241-11:2018. Ergonomics of human-system interaction. Part 11: Usability: Definitions
   and                 concepts.                 2018;               Available             from:
   https://www.iso.org/es/contents/data/standard/08/42/84255.html.
7. ISO/IEC25010:2023. Systems and software engineering — Systems and software Quality
   Requirements and Evaluation (SQuaRE) — Product quality model. 2023; Available from:
   https://www.iso.org/es/contents/data/standard/07/81/78176.html.
8. ISO/IEC25062:2025. Software engineering—software product quality requirements and
   evaluation (SQuaRE)-common industry format (CIF) for usability test reports. 2025;
   Available from: https://www.iso.org/es/contents/data/standard/08/42/84255.html.
```

</details>

## Página 12

12 F. Author and S. Author

9. Nielsen, J. and R. Molich. Heuristic evaluation of user interfaces. in Proceedings of the

SIGCHI conference on Human factors in computing systems. 1990. 10. Albert, B. and T. Tullis, Measuring the user experience: collecting, analyzing, and presenting

usability metrics. 2013: Newnes. 11. Bevan, N., et al. New ISO standards for usability, usability reports and usability measures.

in Human-Computer Interaction. Theory, Design, Development and Practice: 18th International Conference, HCI International 2016, Toronto, ON, Canada, July 17-22, 2016. Proceedings, Part I 18. 2016. Springer. 12. Manzano, C., G. Márquez, and H. Astudillo. Quality Attributes for Zero Trust Architecture-

Based Systems. in 2024 43rd International Conference of the Chilean Computer Science Society (SCCC). 2024. IEEE. 13. Nielsen, J., The usability engineering life cycle. Computer, 1992. 25(3): p. 12-22. 14. Nielsen, C.M., et al. It's worth the hassle! the added value of evaluating the usability of

mobile systems in the field. in Proceedings of the 4th Nordic conference on Human-computer interaction: changing roles. 2006. 15. Brooke, J., SUS-A quick and dirty usability scale. Usability evaluation in industry, 1996.

189(194): p. 4-7. 16. Brooke, J., SUS: a retrospective. Journal of usability studies, 2013. 8(2).

<details>
<summary>Transcripción literal de la página 12</summary>

```text
12       F. Author and S. Author


9. Nielsen, J. and R. Molich. Heuristic evaluation of user interfaces. in Proceedings of the
    SIGCHI conference on Human factors in computing systems. 1990.
10. Albert, B. and T. Tullis, Measuring the user experience: collecting, analyzing, and presenting
    usability metrics. 2013: Newnes.
11. Bevan, N., et al. New ISO standards for usability, usability reports and usability measures.
    in Human-Computer Interaction. Theory, Design, Development and Practice: 18th
    International Conference, HCI International 2016, Toronto, ON, Canada, July 17-22, 2016.
    Proceedings, Part I 18. 2016. Springer.
12. Manzano, C., G. Márquez, and H. Astudillo. Quality Attributes for Zero Trust Architecture-
    Based Systems. in 2024 43rd International Conference of the Chilean Computer Science
    Society (SCCC). 2024. IEEE.
13. Nielsen, J., The usability engineering life cycle. Computer, 1992. 25(3): p. 12-22.
14. Nielsen, C.M., et al. It's worth the hassle! the added value of evaluating the usability of
    mobile systems in the field. in Proceedings of the 4th Nordic conference on Human-computer
    interaction: changing roles. 2006.
15. Brooke, J., SUS-A quick and dirty usability scale. Usability evaluation in industry, 1996.
    189(194): p. 4-7.
16. Brooke, J., SUS: a retrospective. Journal of usability studies, 2013. 8(2).
```

</details>

## Anexo visual: páginas originales

### Página original 1

![Página 1 del artículo original](assets/pagina_01.png)

### Página original 2

![Página 2 del artículo original](assets/pagina_02.png)

### Página original 3

![Página 3 del artículo original](assets/pagina_03.png)

### Página original 4

![Página 4 del artículo original](assets/pagina_04.png)

### Página original 5

![Página 5 del artículo original](assets/pagina_05.png)

### Página original 6

![Página 6 del artículo original](assets/pagina_06.png)

### Página original 7

![Página 7 del artículo original](assets/pagina_07.png)

### Página original 8

![Página 8 del artículo original](assets/pagina_08.png)

### Página original 9

![Página 9 del artículo original](assets/pagina_09.png)

### Página original 10

![Página 10 del artículo original](assets/pagina_10.png)

### Página original 11

![Página 11 del artículo original](assets/pagina_11.png)

### Página original 12

![Página 12 del artículo original](assets/pagina_12.png)

