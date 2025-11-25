// src/pages/parts/RegisterProjectModal.tsx
import { BaseModal } from "@/components";
import { useEffect, useState } from "react";
import { fetchProjectIndex, fetchProjectsList } from "../parts/areasApi";
import { EV_PROJECT_MODAL_SUBMIT } from "./constants/events";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ProjectItem = {
  uuid: string;
  projectId: string;
  projectName: string;
};

type ScheduleItem = { id: string; label: string };

export function RegisterProjectModal({ open, onClose }: Props) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>("");
  const [selectedScheduleUuid, setSelectedScheduleUuid] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 初回：案件一覧を取得
  useEffect(() => {
    async function loadProjects() {
      const projectsList = await fetchProjectsList();
      // fetchProjectsList は { uuid, projectId, projectName }[] を返している
      setProjects(projectsList);
    }

    loadProjects();
  }, []);

  // 案件選択変更時：該当 index.json を読み、スケジュール一覧をセット
  useEffect(() => {
    async function loadSchedules() {
      if (!selectedProjectUuid) {
        setSchedules([]);
        return;
      }

      setLoading(true);
      try {
        console.log(
          "[RegisterProjectModal] fetchProjectIndex",
          selectedProjectUuid
        );
        const projectData = await fetchProjectIndex(selectedProjectUuid);
        console.log("[RegisterProjectModal] projectData", projectData);

        if (projectData && Array.isArray(projectData.schedules)) {
          const schedulesList: ScheduleItem[] = projectData.schedules.map(
            (schedule: any) => ({
              id: schedule.id,
              label: schedule.label,
            })
          );
          setSchedules(schedulesList);
        } else {
          setSchedules([]);
        }
      } catch (error) {
        console.error("Error fetching project details", error);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, [selectedProjectUuid]);

  // OK ボタンが押されたときの処理
  const handleOkButtonClick = () => {
    // 案件・スケジュールが未選択なら保存させない
    if (!selectedProjectUuid || !selectedScheduleUuid) {
      window.alert("案件とスケジュールを選択してください。");
      return;
    }

    // SideListBar 側に「この案件・スケジュールを紐づけたい」というイベントを飛ばす
    window.dispatchEvent(
      new CustomEvent(EV_PROJECT_MODAL_SUBMIT, {
        detail: {
          projectUuid: selectedProjectUuid,
          scheduleUuid: selectedScheduleUuid,
        },
      })
    );

    window.alert("案件情報を紐づけました。\nSAVEボタンで確定してください。");
    onClose();
  };

  // OK ボタンの活性/非活性を制御
  const isOkButtonDisabled = !selectedProjectUuid || !selectedScheduleUuid;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="案件情報を紐づける"
      backdropClassName="map-modal-backdrop"
      containerClassName="map-modal-container"
    >
      <div className="register-project-modal no-caret">
        {/* 案件名（必須） */}
        <div className="register-project-modal__row">
          <label
            htmlFor="projectName"
            className="register-project-modal__label-row"
          >
            <span className="register-project-modal__label">案件名(必須)</span>
          </label>
          <select
            id="projectName"
            name="projectName"
            required
            className="register-project-modal__input register-project-modal__select"
            value={selectedProjectUuid}
            onChange={(e) => {
              setSelectedProjectUuid(e.target.value);
              setSchedules([]); // 案件変更時はいったんクリア
              setSelectedScheduleUuid(""); // 案件変更時、スケジュールもリセット
            }}
          >
            <option value="" disabled>
              案件を選択してください
            </option>
            {projects.map((project) => (
              <option key={project.uuid} value={project.uuid}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>

        {/* スケジュール（必須） */}
        <div className="register-project-modal__row">
          <label
            htmlFor="schedule"
            className="register-project-modal__label-row"
          >
            <span className="register-project-modal__label">
              スケジュール(必須)
            </span>
          </label>
          <select
            id="schedule"
            name="schedule"
            required
            className="register-project-modal__input register-project-modal__select"
            disabled={!selectedProjectUuid || loading}
            value={selectedScheduleUuid}
            onChange={(e) => setSelectedScheduleUuid(e.target.value)}
          >
            <option value="" disabled>
              {loading
                ? "スケジュールを読み込み中..."
                : "スケジュールを選択してください"}
            </option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.label}
              </option>
            ))}
          </select>
        </div>

        {/* 候補地（任意） */}
        {/* <div className="register-project-modal__row">
          <label
            htmlFor="candidate"
            className="register-project-modal__label-row"
          >
            <span className="register-project-modal__label">候補地(任意)</span>
          </label>
          <select
            id="candidate"
            name="candidate"
            className="register-project-modal__input register-project-modal__select"
            defaultValue=""
          >
            <option value="">指定しない（未選択）</option>
            // TODO: 後で候補地の選択肢を連携 
          </select>
        </div> 
        */}

        {/* ボタン行 */}
        <div className="register-project-modal__actions">
          <button
            type="button"
            className="register-project-modal__btn register-project-modal__btn--cancel"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="register-project-modal__btn register-project-modal__btn--ok"
            onClick={handleOkButtonClick}
            disabled={isOkButtonDisabled} // 案件とスケジュール両方が選択されていないと無効
          >
            OK
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
